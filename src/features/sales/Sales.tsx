import { useState } from 'react';
import { useAsync, Button, Input, Select, Dialog, Badge, Alert, EmptyState, SearchBar, ConfirmDialog, PageHeader } from '../../components/ui';
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

  /* The sale just recorded is always shown first, then the rest newest first. */
  const justRecordedId = receipt?.id;
  const orderedSales = (() => {
    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      // Same day, newest record id first. Record ids sort by creation time.
      return String(b.id).localeCompare(String(a.id));
    });
    if (!justRecordedId) return sorted;
    const idx = sorted.findIndex(s => s.id === justRecordedId);
    if (idx <= 0) return sorted;
    const [picked] = sorted.splice(idx, 1);
    return [picked, ...sorted];
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales (POS)"
        subtitle="Record sales, print receipts and invoices, and track credit."
        actions={<>
          <Button variant="secondary" onClick={() => setInvoiceOpen(true)}>New invoice</Button>
          <Button variant="secondary" onClick={() => exportExcel('sales', data.sales.map(s => ({ Receipt: s.receiptNo, Date: s.date, Customer: s.customerName, Litres: s.litres, Total: s.total, Method: s.paymentMethod })))}>Export sales</Button>
        </>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* POS */}
        <section className="panel p-4 space-y-4">
          <h2 className="text-[17px] font-semibold">New sale</h2>
          <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[{ value: 'walkin', label: 'Walk-in customer' }, ...data.customers.map(c => ({ value: c.id, label: `${c.name} (${c.type}, ${fmtKES(c.pricePerLitre)}/L)` }))]} />
          <div>
            <span className="block text-[15px] font-medium mb-1">Quantity (litres)</span>
            <input inputMode="decimal" type="number" value={litres} onChange={(e) => setLitres(e.target.value)} className="w-full min-h-[56px] px-4 rounded-input border border-sand bg-cream text-[24px] num" placeholder="0" />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 5, 10, 20].map(n => <button key={n} onClick={() => setLitres(String(n))} className="min-h-[46px] rounded-pill border border-sand bg-cream font-semibold num text-[15px] hover:bg-cream-deep transition-colors duration-150">{n} L</button>)}
            </div>
          </div>
          <div className="flex justify-between text-[17px]"><span>Price: <span className="num">{fmtKES(price)} / L</span></span><span className="font-bold num">Total: {fmtKES(total)}</span></div>

          <div>
            <span className="block text-[15px] font-medium mb-1">Payment method</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['cash', 'mpesa', 'bank', 'credit', 'split'] as const).map(m => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    aria-pressed={active}
                    className={`min-h-[48px] rounded-pill border font-semibold text-[15px] transition-colors duration-150 ${
                      active ? 'bg-forest text-cream border-forest' : 'bg-cream border-sand text-ink hover:bg-cream-deep'
                    }`}
                  >
                    {m === 'mpesa' ? 'M-Pesa' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {method === 'cash' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount received (KES)" type="number" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
              <div><span className="block text-[15px] font-medium mb-1">Change</span><div className="min-h-[46px] px-4 py-2 rounded-input bg-cream border border-sand num font-bold inline-flex items-center">{fmtKES(change)}</div></div>
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
          <section className="panel p-4 md:p-5">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Receipt</h2>
                <p className="panel-sub">Shown after a sale is recorded.</p>
              </div>
              {receipt && (
                <div className="flex flex-wrap justify-end gap-2 no-print">
                  <Button size="sm" variant="secondary" onClick={() => printArea(document.querySelector('.receipt-print')?.outerHTML || '')}>Print</Button>
                  <Button size="sm" variant="secondary" onClick={async () => { await api.sendMessage({ channel: 'sms', to: phone || '0712 345 678', body: `Receipt ${receipt.receiptNo}: ${fmtL(receipt.litres)} for ${fmtKES(receipt.total)}. Thank you.` }); pushToast('Receipt sent by SMS'); }}>Send by SMS</Button>
                  <Button size="sm" variant="secondary" onClick={async () => { await api.sendMessage({ channel: 'email', to: 'customer@example.co.ke', body: `Receipt ${receipt.receiptNo}` }); pushToast('Receipt sent by email'); }}>Send by email</Button>
                </div>
              )}
            </div>

            {receipt ? (
              <div className="flex justify-center">
                <div className="receipt-print w-full max-w-[80mm] border border-sand rounded-panel p-4 bg-paper text-[13px] leading-relaxed">
                  <div className="text-center font-bold text-[15px]">Mau Crest Dairies</div>
                  <div className="text-center text-ink-muted">Molo, Nakuru County · 0712 345 678</div>
                  <div className="text-center text-ink-muted">Nurtured by Nature, Delivered Fresh</div>
                  <hr className="my-2.5 border-sand" />
                  <dl className="space-y-1 m-0">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Receipt</dt>
                      <dd className="m-0 num text-right break-all">{receipt.receiptNo}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Date</dt>
                      <dd className="m-0 text-right">{fmtDate(receipt.date)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted shrink-0">Customer</dt>
                      <dd className="m-0 text-right break-words min-w-0">{receipt.customerName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{fmtL(receipt.litres)} × {fmtKES(receipt.pricePerLitre)}</dt>
                      <dd className="m-0 num text-right">{fmtKES(receipt.total)}</dd>
                    </div>
                    {receipt.mpesaCode && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">M-Pesa code</dt>
                        <dd className="m-0 num text-right">{receipt.mpesaCode}</dd>
                      </div>
                    )}
                  </dl>
                  <hr className="my-2.5 border-sand" />
                  <div className="flex justify-between gap-3 font-bold text-[15px]">
                    <span>Total</span>
                    <span className="num">{fmtKES(receipt.total)}</span>
                  </div>
                  <div className="flex justify-between gap-3 mt-1">
                    <span className="text-ink-muted">Paid by</span>
                    <span className="capitalize">{receipt.paymentMethod === 'mpesa' ? 'M-Pesa' : receipt.paymentMethod}</span>
                  </div>
                  <p className="text-center mt-3 mb-0 text-ink-muted">Thank you for buying from Mau Crest Dairies.</p>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-ink-muted">Record a sale to see the receipt here.</p>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Cash-up for today</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[13px] text-ink-muted">Expected cash</div><div className="text-[20px] font-bold num">{fmtKES(expectedCash)}</div></div>
              <Input label="Counted cash (KES)" type="number" inputMode="decimal" value={cashCounted} onChange={(e) => setCashCounted(e.target.value)} />
            </div>
            {cashCounted && <div className="mt-2 text-[15px]">Difference: <span className="num font-bold">{fmtKES((Number(cashCounted) || 0) - expectedCash)}</span></div>}
          </section>
        </div>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap gap-3 items-center mb-3">
          <h2 className="text-[17px] font-semibold">Sales list</h2>
          <div className="flex-1" />
          <div className="w-64"><SearchBar value={filter} onChange={setFilter} placeholder="Filter by customer or receipt" /></div>
        </div>
        {filtered.length === 0 ? <EmptyState title="No sales" body="Sales you record will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[720px]">
              <thead><tr><th>Receipt</th><th>Date</th><th>Customer</th><th>Litres</th><th>Total</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orderedSales
                  .slice(0, 40)
                  .map(s => (
                  <tr key={s.id}>
                    <td className="num">{s.receiptNo}</td><td>{fmtDate(s.date)}</td><td>{s.customerName}</td>
                    <td className="num">{fmtL(s.litres)}</td><td className="num">{fmtKES(s.total)}</td>
                    <td className="capitalize">{s.paymentMethod}</td>
                    <td><Badge tone={s.status === 'completed' ? 'success' : 'danger'}>{s.status}</Badge></td>
                    <td>{s.status === 'completed' && <button className="text-danger font-semibold min-h-[44px] px-2" onClick={() => setVoidSale(s)}>Void</button>}</td>
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
