import { useState } from 'react';
import { useAsync, Button, Input, Select, Dialog, Badge, EmptyState, SearchBar, Alert, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel, printArea } from '../../lib/export';

export function CustomersList() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(() => api.listCustomers());
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', type: 'individual', phone: '', email: '', pricePerLitre: 80, creditLimit: 0, address: '' });

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const filtered = data.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    await api.saveCustomer({ ...form, pricePerLitre: Number(form.pricePerLitre) || 0, creditLimit: Number(form.creditLimit) || 0, balance: 0, createdBy: user?.name, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Customers', record: form.name, oldValue: '', newValue: form.type, at: new Date().toISOString() });
    setOpen(false); pushToast('Customer saved'); reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        subtitle="Regular buyers, credit balances and contact details."
        actions={<>
          <Button variant="secondary" onClick={() => exportExcel('customers', data.map(c => ({ Name: c.name, Type: c.type, Phone: c.phone, Balance: c.balance })))}>Export</Button>
          <Button onClick={() => setOpen(true)}>Add customer</Button>
        </>}
      />
      <div className="w-full md:w-80"><SearchBar value={q} onChange={setQ} placeholder="Search customers" /></div>
      {filtered.length === 0 ? <EmptyState title="No customers" body="Add your first customer to start selling." action={<Button onClick={() => setOpen(true)}>Add customer</Button>} /> : (
        <div className="panel overflow-x-auto">
          <table className="table-base min-w-[720px]">
            <thead><tr><th>Name</th><th>Type</th><th>Phone</th><th>Price / L</th><th>Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><a href={`#/customers/${c.id}`} className="text-forest font-semibold underline">{c.name}</a></td>
                  <td className="capitalize">{c.type}</td><td className="num">{c.phone}</td>
                  <td className="num">{fmtKES(c.pricePerLitre)}</td>
                  <td className="num">{c.balance > 0 ? <Badge tone="warning">{fmtKES(c.balance)}</Badge> : fmtKES(0)}</td>
                  <td><a href={`#/customers/${c.id}`} className="text-forest font-semibold min-h-[44px] inline-flex items-center px-2">View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add customer">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'individual', label: 'Individual' }, { value: 'shop', label: 'Shop' }, { value: 'cooperative', label: 'Cooperative' }]} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712 345 678" />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Price per litre (KES)" type="number" value={form.pricePerLitre} onChange={(e) => setForm({ ...form, pricePerLitre: e.target.value })} />
          <Input label="Credit limit (KES)" type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save customer</Button></div>
        </div>
      </Dialog>
    </div>
  );
}

export function CustomerProfile({ id }: { id: string }) {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [customers, sales] = await Promise.all([api.listCustomers(), api.listSales()]);
    return { customer: customers.find(c => c.id === id), sales: sales.filter(s => s.customerId === id) };
  });
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const c = data.customer;
  if (!c) return <EmptyState title="Customer not found" body="This customer may have been deleted." />;

  const receivePayment = async () => {
    const amt = Number(amount) || 0;
    await api.saveCustomer({ ...c, balance: Math.max(0, c.balance - amt), updatedBy: user?.name, updatedAt: new Date().toISOString() });
    await api.sendMessage({ channel: method === 'mpesa' ? 'sms' : 'email', to: c.phone, body: `Payment of ${fmtKES(amt)} received. New balance: ${fmtKES(Math.max(0, c.balance - amt))}.` });
    setPayOpen(false); pushToast('Payment received'); reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader title={c.name} subtitle="Customer details, statements and sales history." />
      <div className="panel p-4 grid md:grid-cols-4 gap-4 text-[15px]">
        <div><div className="text-ink-muted text-[13px]">Type</div><div className="capitalize">{c.type}</div></div>
        <div><div className="text-ink-muted text-[13px]">Phone</div><div className="num">{c.phone}</div></div>
        <div><div className="text-ink-muted text-[13px]">Price</div><div className="num">{fmtKES(c.pricePerLitre)} / L</div></div>
        <div><div className="text-ink-muted text-[13px]">Balance</div><div className="num font-bold">{fmtKES(c.balance)}</div></div>
        <div><div className="text-ink-muted text-[13px]">Credit limit</div><div className="num">{fmtKES(c.creditLimit)}</div></div>
        <div><div className="text-ink-muted text-[13px]">Address</div><div>{c.address}</div></div>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => setPayOpen(true)}>Receive payment</Button>
        <Button variant="secondary" onClick={() => printArea(`<h2>Statement — ${c.name}</h2><p>Balance: ${fmtKES(c.balance)}</p><table><tr><th>Date</th><th>Litres</th><th>Total</th></tr>${data.sales.map(s => `<tr><td>${s.date}</td><td>${s.litres}</td><td>${fmtKES(s.total)}</td></tr>`).join('')}</table>`)}>Print statement</Button>
      </div>
      <div className="panel p-4">
        <h2 className="text-[17px] font-semibold mb-3">Sales history</h2>
        {data.sales.length === 0 ? <p className="text-[15px] text-ink-muted">No sales yet for this customer.</p> : (
          <table className="table-base"><thead><tr><th>Date</th><th>Receipt</th><th>Litres</th><th>Total</th></tr></thead>
          <tbody>{data.sales.map(s => <tr key={s.id}><td>{fmtDate(s.date)}</td><td className="p-2 num">{s.receiptNo}</td><td className="p-2 num">{s.litres} L</td><td className="p-2 num">{fmtKES(s.total)}</td></tr>)}</tbody></table>
        )}
      </div>
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} title="Receive payment">
        <div className="space-y-4">
          <Input label="Amount (KES)" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }, { value: 'bank', label: 'Bank' }]} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={receivePayment}>Record payment</Button></div>
        </div>
      </Dialog>
    </div>
  );
}

export function CreditAgeing() {
  const { data, loading } = useAsync(() => api.listCustomers());
  if (loading || !data) return <div className="h-24 bg-cream-deep skeleton-pulse rounded-panel" />;
  const debtors = data.filter(c => c.balance > 0);
  return (
    <div className="panel p-4">
      <h2 className="text-[17px] font-semibold mb-3">Credit ageing</h2>
      <table className="table-base">
        <thead><tr><th>Customer</th><th>Balance</th><th>Ageing</th></tr></thead>
        <tbody>{debtors.map(c => <tr key={c.id}><td>{c.name}</td><td className="p-2 num">{fmtKES(c.balance)}</td><td>{c.balance > 40000 ? 'Over 60 days' : c.balance > 20000 ? '30 days' : 'Current'}</td></tr>)}</tbody>
      </table>
      <p className="text-[13px] text-ink-muted mt-2">Total outstanding: {fmtKES(sum(debtors.map(c => c.balance)))}</p>
    </div>
  );
}
