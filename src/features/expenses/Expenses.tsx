import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAsync, Button, Input, Select, Dialog, EmptyState, SearchBar, FileDropzone } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, sum, todayISO } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel } from '../../lib/export';

const CATS = ['Feed', 'Drugs and veterinary', 'Wages', 'Utilities', 'Transport', 'Repairs', 'Other'];

export function ExpensesPage() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(() => api.listExpenses());
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ date: todayISO(), category: 'Feed', supplier: '', amount: '', paymentMethod: 'cash', linkedAnimal: '', note: '', files: [] as string[] });

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const filtered = data.filter(e => (cat === 'all' || e.category === cat) && (e.supplier.toLowerCase().includes(q.toLowerCase()) || e.category.toLowerCase().includes(q.toLowerCase())));
  const total = sum(filtered.map(e => e.amount));
  const byCat = CATS.map(c => ({ category: c, amount: sum(data.filter(e => e.category === c).map(e => e.amount)) }));

  const save = async () => {
    await api.saveExpense({ ...form, amount: Number(form.amount) || 0, payrollRunId: '', createdBy: user?.name, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Expenses', record: form.category, oldValue: '', newValue: fmtKES(Number(form.amount) || 0), at: new Date().toISOString() });
    setOpen(false); pushToast('Expense saved'); reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold">Expenses</h1>
        <span className="text-[15px] text-ink-muted num">Total: {fmtKES(total)}</span>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => exportExcel('expenses', filtered.map(e => ({ Date: e.date, Category: e.category, Supplier: e.supplier, Amount: e.amount })))}>Export</Button>
        <Button onClick={() => setOpen(true)}>Add expense</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Search supplier or category" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...CATS.map(c => ({ value: c, label: c }))]} />
      </div>
      <section className="bg-paper border border-sand rounded-panel p-4">
        <h2 className="text-[17px] font-semibold mb-3">Spending by category</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCat}>
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="amount" fill="#1F4D2E" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      {filtered.length === 0 ? <EmptyState title="No expenses" body="Add your first expense to track profit and loss." action={<Button onClick={() => setOpen(true)}>Add expense</Button>} /> : (
        <div className="bg-paper border border-sand rounded-panel overflow-x-auto">
          <table className="w-full text-[15px] min-w-[720px]">
            <thead><tr className="bg-cream-deep text-left"><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Supplier</th><th className="p-3">Amount</th><th className="p-3">Method</th></tr></thead>
            <tbody>
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60).map(e => (
                <tr key={e.id} className="border-t border-sand"><td className="p-3">{fmtDate(e.date)}</td><td className="p-3">{e.category}</td><td className="p-3">{e.supplier}</td><td className="p-3 num">{fmtKES(e.amount)}</td><td className="p-3 capitalize">{e.paymentMethod}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add expense">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATS.map(c => ({ value: c, label: c }))} />
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            <Input label="Amount (KES)" type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Payment method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }, { value: 'bank', label: 'Bank' }]} />
            <Input label="Linked animal (optional)" value={form.linkedAnimal} onChange={(e) => setForm({ ...form, linkedAnimal: e.target.value })} placeholder="MC-001" />
          </div>
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <FileDropzone onFiles={(names) => setForm({ ...form, files: [...(form.files || []), ...names] })} />
          {form.files?.length > 0 && <p className="text-[13px] text-ink-muted">Attached: {form.files.join(', ')}</p>}
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save expense</Button></div>
        </div>
      </Dialog>
    </div>
  );
}
