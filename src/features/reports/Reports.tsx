import { useState } from 'react';
import { useAsync, Button, Select, Input, Badge, Alert, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { can } from '../../lib/permissions';
import { exportExcel, exportPdf } from '../../lib/export';

const REPORTS = [
  { id: 'milk', label: 'Daily milk totals' },
  { id: 'revenue', label: 'Monthly revenue' },
  { id: 'cow', label: 'Per-cow performance' },
  { id: 'health', label: 'Health history' },
  { id: 'employees', label: 'Employee records' },
  { id: 'pnl', label: 'Profit and loss' },
  { id: 'credit', label: 'Credit balances' },
  { id: 'sales', label: 'Sales by customer' },
  { id: 'expenses', label: 'Expenses by category' }
];

export function ReportsPage() {
  const { user } = useSession();
  const { data, loading } = useAsync(async () => {
    const [milk, sales, expenses, animals, health, employees, customers] = await Promise.all([
      api.listMilk(), api.listSales(), api.listExpenses(), api.listAnimals(), api.listHealth(), api.listEmployees(), api.listCustomers()
    ]);
    return { milk, sales, expenses, animals, health, employees, customers };
  });
  const [report, setReport] = useState('milk');
  const [preset, setPreset] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const canProfit = can(user, 'reports.profit');
  if (!canProfit && report === 'pnl') return <Alert tone="danger">You do not have permission to view profit and loss.</Alert>;

  const range = () => {
    const today = new Date();
    if (preset === 'today') return { from: today.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    if (preset === '7days') return { from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    if (preset === 'month') return { from: today.toISOString().slice(0, 7) + '-01', to: today.toISOString().slice(0, 10) };
    if (preset === 'lastmonth') { const d = new Date(today.getFullYear(), today.getMonth() - 1, 1); return { from: d.toISOString().slice(0, 10), to: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10) }; }
    return { from: from || '2020-01-01', to: to || today.toISOString().slice(0, 10) };
  };
  const r = range();

  const build = (): { headers: string[]; rows: any[][]; excel: Record<string, any>[] } => {
    if (report === 'milk') {
      const rows = data.milk.filter(m => m.date >= r.from && m.date <= r.to);
      const byDate = new Map<string, number>();
      rows.forEach(m => byDate.set(m.date, (byDate.get(m.date) || 0) + m.totalLitres));
      const arr = [...byDate.entries()].sort();
      return { headers: ['Date', 'Litres'], rows: arr.map(([d, v]) => [d, v.toFixed(1)]), excel: arr.map(([d, v]) => ({ Date: d, Litres: v })) };
    }
    if (report === 'revenue') {
      const rows = data.sales.filter(s => s.date >= r.from && s.date <= r.to && s.status === 'completed');
      const byMonth = new Map<string, number>();
      rows.forEach(s => { const k = s.date.slice(0, 7); byMonth.set(k, (byMonth.get(k) || 0) + s.total); });
      const arr = [...byMonth.entries()].sort();
      return { headers: ['Month', 'Revenue (KES)'], rows: arr.map(([d, v]) => [d, v.toLocaleString()]), excel: arr.map(([d, v]) => ({ Month: d, Revenue: v })) };
    }
    if (report === 'cow') {
      const rows = data.animals.filter(a => a.group === 'lactating' && a.status === 'active').map(a => ({ Tag: a.tag, Name: a.name, Breed: a.breed }));
      return { headers: ['Tag', 'Name', 'Breed'], rows: rows.map(x => [x.Tag, x.Name, x.Breed]), excel: rows };
    }
    if (report === 'health') {
      const rows = data.health.filter(h => h.date >= r.from && h.date <= r.to);
      return { headers: ['Date', 'Type', 'Product', 'Animals', 'Cost'], rows: rows.map(h => [h.date, h.type, h.product, h.animalIds.length, h.cost]), excel: rows.map(h => ({ Date: h.date, Type: h.type, Product: h.product, Animals: h.animalIds.length, Cost: h.cost })) };
    }
    if (report === 'employees') {
      return { headers: ['Name', 'Role', 'Phone', 'Salary'], rows: data.employees.map(e => [e.name, e.role, e.phone, e.salary]), excel: data.employees.map(e => ({ Name: e.name, Role: e.role, Phone: e.phone, Salary: e.salary })) };
    }
    if (report === 'pnl') {
      const rev = sum(data.sales.filter(s => s.date >= r.from && s.date <= r.to && s.status === 'completed').map(s => s.total));
      const exp = sum(data.expenses.filter(e => e.date >= r.from && e.date <= r.to).map(e => e.amount));
      return { headers: ['Item', 'Amount (KES)'], rows: [['Revenue', rev.toLocaleString()], ['Expenses', exp.toLocaleString()], ['Net profit', (rev - exp).toLocaleString()]], excel: [{ Item: 'Revenue', Amount: rev }, { Item: 'Expenses', Amount: exp }, { Item: 'Net profit', Amount: rev - exp }] };
    }
    if (report === 'credit') {
      const rows = data.customers.filter(c => c.balance > 0);
      return { headers: ['Customer', 'Balance'], rows: rows.map(c => [c.name, c.balance]), excel: rows.map(c => ({ Customer: c.name, Balance: c.balance })) };
    }
    if (report === 'sales') {
      const byCust = new Map<string, number>();
      data.sales.filter(s => s.date >= r.from && s.date <= r.to).forEach(s => byCust.set(s.customerName, (byCust.get(s.customerName) || 0) + s.total));
      const arr = [...byCust.entries()].sort((a, b) => b[1] - a[1]);
      return { headers: ['Customer', 'Total (KES)'], rows: arr.map(([c, v]) => [c, v.toLocaleString()]), excel: arr.map(([c, v]) => ({ Customer: c, Total: v })) };
    }
    const byCat = new Map<string, number>();
    data.expenses.filter(e => e.date >= r.from && e.date <= r.to).forEach(e => byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount));
    const arr = [...byCat.entries()];
    return { headers: ['Category', 'Amount (KES)'], rows: arr.map(([c, v]) => [c, v.toLocaleString()]), excel: arr.map(([c, v]) => ({ Category: c, Amount: v })) };
  };

  const out = build();

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Choose a report and date range, then export to Excel or PDF." />
      <div className="grid md:grid-cols-4 gap-3">
        <Select label="Report" value={report} onChange={(e) => setReport(e.target.value)} options={REPORTS.map(r => ({ value: r.id, label: r.label }))} />
        <Select label="Date preset" value={preset} onChange={(e) => setPreset(e.target.value)} options={[{ value: 'today', label: 'Today' }, { value: '7days', label: 'Last 7 days' }, { value: 'month', label: 'This month' }, { value: 'lastmonth', label: 'Last month' }, { value: 'custom', label: 'Custom' }]} />
        {preset === 'custom' && (<><Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></>)}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => exportExcel(report + '-report', out.excel)}>Export to Excel</Button>
        <Button variant="secondary" onClick={() => exportPdf(report + '-report', REPORTS.find(x => x.id === report)?.label || 'Report', out.headers, out.rows)}>Export to PDF</Button>
      </div>
      <div className="panel p-4">
        <h2 className="text-[17px] font-semibold mb-3">{REPORTS.find(x => x.id === report)?.label} — preview</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr>{out.headers.map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>{out.rows.slice(0, 30).map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className="p-2 num">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="text-[13px] text-ink-muted mt-2">{out.rows.length} rows. Showing first 30.</p>
      </div>
    </div>
  );
}
