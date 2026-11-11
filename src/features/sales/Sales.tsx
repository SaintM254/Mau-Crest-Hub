import { useState } from 'react';
import { useAsync, Button, Input, Select, Dialog, Badge, Alert, EmptyState, SearchBar, ConfirmDialog } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtL, fmtDate, todayISO, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel, printArea } from '../../lib/export';

export function SalesPage() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [sales, customers, settings] = await Promise.all([api.listSales(), api.listCustomers(), api.getSettings()]);
    return { sales, customers, settings };
  });
  const [customerId, setCustomerId] = useState('walkin');
  const [litres, setLitres] = useState('');
  const [method, setMethod] = useState<'cash' | 'mpesa' | 'bank' | 'credit' | 'split'>('cash');
  const [received, setReceived] = useState('');
  const [phone, setPhone] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [mpesaStep, setMpesaStep] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [voidSale, setVoidSale] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [filter, setFilter] = useState('');
  const [cashCounted, setCashCounted] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invCustomer, setInvCustomer] = useState('');
  const [invFrom, setInvFrom] = useState(todayISO());
  const [invTo, setInvTo] = useState(todayISO());

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;

  const customer = data.customers.find(c => c.id === customerId);
  const price = customerId === 'walkin' ? (data.settings?.priceIndividual || 80) : customer?.pricePerLitre || 80;
  const total = Math.round((Number(litres) || 0) * price);
  const change = Math.max(0, (Number(received) || 0) - total);
  const todaySales = data.sales.filter(s => s.date === todayISO() && s.status === 'completed');
  const expectedCash = sum(todaySales.filter(s => s.paymentMethod === 'cash').map(s => s.total));

  const recordSale = async () => {
    if (!litres || Number(litres) <= 0) return;
    if (method === 'credit' && customer && customer.balance + total > customer.creditLimit) {
      alert('This sale would go over the customer credit limit. Choose another payment method.');
      return;
    }
    const receiptNo = 'MC-R-' + String(data.sales.length + 1).padStart(6, '0');
    const sale: any = {
      receiptNo, invoiceNo: '', date: todayISO(), customerId: customerId === 'walkin' ? '' : customerId,
      customerName: customerId === 'walkin' ? 'Walk-in customer' : customer?.name || '',
      customerType: customerId === 'walkin' ? 'walkin' : customer?.type || '',
      litres: Number(litres), pricePerLitre: price, total, paymentMethod: method,
      amountReceived: method === 'cash' ? Number(received) || total : total, change,
      mpesaCode, bankRef, status: 'completed', voidReason: '',
      createdBy: user?.name || '', updatedBy: user?.name || '', updatedAt: new Date().toISOString(), synced: true
    };
    const saved = await api.saveSale(sale);
    if (method === 'credit' && customer) {
      await api.saveCustomer({ ...customer, balance: customer.balance + total, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    }
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Sales', record: receiptNo, oldValue: '', newValue: `${sale.litres} L, ${fmtKES(total)}`, at: new Date().toISOString() });
    setReceipt(saved);
    pushToast('Sale saved');
    reload();
  };

  const sendMpesa = () => {
    setMpesaStep('Request sent');
    setTimeout(() => setMpesaStep('Waiting for customer'), 900);
    setTimeout(() => {
      const code = Array.from({ length: 10 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
      setMpesaCode(code);
      setMpesaStep('Confirmed');
    }, 2200);
  };

  const doVoid = async () => {
    if (!voidSale) return;
    await api.saveSale({ ...voidSale, status: 'voided', voidReason, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    await api.addAudit({ user: user?.name, action: 'Deleted', module: 'Sales', record: voidSale.receiptNo, oldValue: 'completed', newValue: 'voided: ' + voidReason, at: new Date().toISOString() });
    setVoidSale(null); setVoidReason('');
    pushToast('Sale voided');
    reload();
  };

  const filtered = data.sales.filter(s => !filter || s.customerName.toLowerCase().includes(filter.toLowerCase()) || s.receiptNo.includes(filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold">Sales (POS)</h1>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => setInvoiceOpen(true)}>New invoice</Button>
        <Button variant="secondary" onClick={() => exportExcel('sales', data.sales.map(s => ({ Receipt: s.receiptNo, Date: s.date, Customer: s.customerName, Litres: s.litres, Total: s.total, Method: s.paymentMethod })))}>Export sales</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* POS */}
        <section className="bg-paper border border-sand rounded-panel p-4 space-y-4">
          <h2 className="text-[17px] font-semibold">New sale</h2>
          <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[{ value: 'walkin', label: 'Walk-in customer' }, ...data.customers.map(c => ({ value: c.id, label: `${c.name} (${c.type}, ${fmtKES(c.pricePerLitre)}/L)` }))]} />
          <div>
            <span className="block text-[15px] font-medium mb-1">Quantity (litres)</span>
            <input inputMode="decimal" type="number" value={litres} onChange={(e) => setLitres(e.target.value)} className="w-full min-h-[56px] px-4 rounded-input border border-sand bg-paper text-[24px] num" placeholder="0" />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 5, 10, 20].map(n => <button key={n} onClick={() => setLitres(String(n))} className="min-h-[48px] rounded-input border border-sand bg-cream-deep font-semibold num">{n} L</button>)}
            </div>
          </div>
          <div className="flex justify-between text-[17px]"><span>Price: <span className="num">{fmtKES(price)} / L</span></span><span className="font-bold num">Total: {fmtKES(total)}</span></div>

          <div>
            <span className="block text-[15px] font-medium mb-1">Payment method</span>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'mpesa', 'bank', 'credit', 'split'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`min-h-[48px] rounded-input border font-semibold capitalize text-[15px] ${method === m ? 'bg-forest text-cream border-forest' : 'bg-paper border-sand'}`}>{m}</button>
              ))}
            </div>
          </div>

          {method === 'cash' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount received (KES)" type="number" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
              <div><span className="block text-[15px] font-medium mb-1">Change</span><div className="min-h-[44px] px-3 py-2 rounded-input bg-cream-deep num font-bold">{fmtKES(change)}</div></div>
            </div>
          )}
          {method === 'mpesa' && (
            <div className="space-y-3">
              <Input label="Customer phone (M-Pesa)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />
              <Button variant="secondary" onClick={sendMpesa}>Send payment request</Button>
              {mpesaStep && <div className="text-[15px]"><Badge tone={mpesaStep === 'Confirmed' ? 'success' : 'info'}>{mpesaStep}</Badge>{mpesaCode && <span className="ml-2 num">Code: {mpesaCode}</span>}</div>}
            </div>
          )}
          {method === 'bank' && <Input label="Bank reference" value={bankRef} onChange={(e) => setBankRef(e.target.value)} />}
          {method === 'credit' && customer && <Alert tone="info">Balance after this sale: {fmtKES(customer.balance + total)} (limit {fmtKES(customer.creditLimit)}).</Alert>}
          {method === 'split' && <Alert tone="info">Split payment: take part cash and part M-Pesa. Record the full total here.</Alert>}

          <Button onClick={recordSale} className="w-full min-h-[56px] text-[17px]">Record sale</Button>
        </section>

        {/* Receipt + cash-up */}
        <div className="space-y-4">
          <section className="bg-paper border border-sand rounded-panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Receipt</h2>
            {receipt ? (
              <div className="receipt-print border border-sand p-4 bg-paper">
                <div className="text-center font-bold">Mau Crest Dairies</div>
                <div className="text-center text-[13px]">Molo, Nakuru County · 0712 345 678</div>
                <div className="text-center text-[13px]">Nurtured by Nature, Delivered Fresh</div>
                <hr className="my-2 border-sand" />
                <div className="flex justify-between"><span>Receipt</span><span className="num">{receipt.receiptNo}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{fmtDate(receipt.date)}</span></div>
                <div className="flex justify-between"><span>Customer</span><span>{receipt.customerName}</span></div>
                <div className="flex justify-between"><span>{fmtL(receipt.litres)} x {fmtKES(receipt.pricePerLitre)}</span><span className="num">{fmtKES(receipt.total)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span className="num">{fmtKES(receipt.total)}</span></div>
                <div className="flex justify-between"><span>Paid by</span><span className="capitalize">{receipt.paymentMethod}</span></div>
                {receipt.mpesaCode && <div className="flex justify-between"><span>M-Pesa code</span><span className="num">{receipt.mpesaCode}</span></div>}
                <div className="text-center text-[13px] mt-2">Thank you for buying from Mau Crest Dairies.</div>
                <div className="flex gap-2 mt-3 no-print">
                  <Button variant="secondary" onClick={() => printArea(document.querySelector('.receipt-print')?.outerHTML || '')}>Print</Button>
                  <Button variant="secondary" onClick={async () => { await api.sendMessage({ channel: 'sms', to: phone || '0712 345 678', body: `Receipt ${receipt.receiptNo}: ${fmtL(receipt.litres)} for ${fmtKES(receipt.total)}. Thank you.` }); pushToast('Receipt sent by SMS'); }}>Send by SMS</Button>
                  <Button variant="secondary" onClick={async () => { await api.sendMessage({ channel: 'email', to: 'customer@example.co.ke', body: `Receipt ${receipt.receiptNo}` }); pushToast('Receipt sent by email'); }}>Send by email</Button>
                </div>
              </div>
            ) : <p className="text-[15px] text-ink-muted">Record a sale to see the receipt here.</p>}
          </section>

          <section className="bg-paper border border-sand rounded-panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Cash-up for today</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[13px] text-ink-muted">Expected cash</div><div className="text-[20px] font-bold num">{fmtKES(expectedCash)}</div></div>
              <Input label="Counted cash (KES)" type="number" inputMode="decimal" value={cashCounted} onChange={(e) => setCashCounted(e.target.value)} />
            </div>
            {cashCounted && <div className="mt-2 text-[15px]">Difference: <span className="num font-bold">{fmtKES((Number(cashCounted) || 0) - expectedCash)}</span></div>}
          </section>
        </div>
      </div>

      <section className="bg-paper border border-sand rounded-panel p-4">
        <div className="flex flex-wrap gap-3 items-center mb-3">
          <h2 className="text-[17px] font-semibold">Sales list</h2>
          <div className="flex-1" />
          <div className="w-64"><SearchBar value={filter} onChange={setFilter} placeholder="Filter by customer or receipt" /></div>
        </div>
        {filtered.length === 0 ? <EmptyState title="No sales" body="Sales you record will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] min-w-[720px]">
              <thead><tr className="bg-cream-deep text-left"><th className="p-3">Receipt</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Litres</th><th className="p-3">Total</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map(s => (
                  <tr key={s.id} className="border-t border-sand">
                    <td className="p-3 num">{s.receiptNo}</td><td className="p-3">{fmtDate(s.date)}</td><td className="p-3">{s.customerName}</td>
                    <td className="p-3 num">{fmtL(s.litres)}</td><td className="p-3 num">{fmtKES(s.total)}</td>
                    <td className="p-3 capitalize">{s.paymentMethod}</td>
                    <td className="p-3"><Badge tone={s.status === 'completed' ? 'success' : 'danger'}>{s.status}</Badge></td>
                    <td className="p-3">{s.status === 'completed' && <button className="text-danger font-semibold min-h-[44px] px-2" onClick={() => setVoidSale(s)}>Void</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog open={!!voidSale} onClose={() => setVoidSale(null)} onConfirm={doVoid} title="Void sale" body={`Void receipt ${voidSale?.receiptNo} for ${voidSale ? fmtKES(voidSale.total) : ''}? This cannot be undone and will be recorded in the audit log.`} confirmLabel="Void sale" />
      {voidSale && (
        <Dialog open={!!voidSale} onClose={() => setVoidSale(null)} title="Void reason">
          <Input label="Reason for voiding (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <div className="flex gap-3 justify-end mt-4"><Button variant="secondary" onClick={() => setVoidSale(null)}>Cancel</Button><Button variant="danger" disabled={!voidReason} onClick={doVoid}>Void sale</Button></div>
        </Dialog>
      )}

      <Dialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="New invoice">
        <div className="space-y-4">
          <Select label="Customer" value={invCustomer} onChange={(e) => setInvCustomer(e.target.value)} options={[{ value: '', label: 'Choose customer' }, ...data.customers.map(c => ({ value: c.id, label: c.name }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="From date" type="date" value={invFrom} onChange={(e) => setInvFrom(e.target.value)} />
            <Input label="To date" type="date" value={invTo} onChange={(e) => setInvTo(e.target.value)} />
          </div>
          <Button onClick={async () => {
            const c = data.customers.find(x => x.id === invCustomer);
            const rows = data.sales.filter(s => s.customerId === invCustomer && s.date >= invFrom && s.date <= invTo);
            const litres = sum(rows.map(r => r.litres));
            const total = Math.round(litres * (c?.pricePerLitre || 65));
            await api.saveInvoice({ invoiceNo: 'MC-INV-2026-' + String(Math.floor(Math.random() * 9000) + 1000), customerId: invCustomer, customerName: c?.name || '', fromDate: invFrom, toDate: invTo, litres: Math.round(litres * 10) / 10, total, status: 'unpaid', createdAt: new Date().toISOString() });
            pushToast('Invoice created');
            setInvoiceOpen(false);
          }}>Create invoice</Button>
        </div>
      </Dialog>
    </div>
  );
}
