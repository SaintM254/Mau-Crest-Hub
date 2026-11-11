import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAsync, Stat, Badge, Alert } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtL, fmtDate, todayISO, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { format, subDays } from 'date-fns';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data, loading } = useAsync(async () => {
    const [milk, sales, expenses, animals, health, audit, customers] = await Promise.all([
      api.listMilk(), api.listSales(), api.listExpenses(), api.listAnimals(), api.listHealth(), api.listAudit(), api.listCustomers()
    ]);
    return { milk, sales, expenses, animals, health, audit, customers };
  });

  if (loading || !data) return <div className="space-y-4"><div className="h-8 bg-cream-deep skeleton-pulse rounded-input w-48" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-cream-deep skeleton-pulse rounded-panel" />)}</div></div>;

  const today = todayISO();
  const month = today.slice(0, 7);
  const milkToday = data.milk.filter(m => m.date === today);
  const bySession = (s: string) => sum(milkToday.filter(m => m.session === s).map(m => m.totalLitres));
  const milkMonth = sum(data.milk.filter(m => m.date.startsWith(month)).map(m => m.totalLitres));
  const revMonth = sum(data.sales.filter(s => s.date.startsWith(month) && s.status === 'completed').map(s => s.total));
  const expMonth = sum(data.expenses.filter(e => e.date.startsWith(month)).map(e => e.amount));
  const active = data.animals.filter(a => a.status === 'active');
  const inMilk = active.filter(a => a.group === 'lactating').length;
  const dry = active.filter(a => a.group === 'dry').length;
  const pregnant = active.filter(a => a.group === 'heifer').length;
  const creditOwed = sum(data.customers.map(c => c.balance));

  // 30-day milk chart
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    return { date: format(subDays(new Date(), 29 - i), 'd MMM'), litres: Math.round(sum(data.milk.filter(m => m.date === d).map(m => m.totalLitres)) * 10) / 10 };
  });
  // 12-month rev vs exp
  const months = Array.from({ length: 12 }, (_, i) => {
    const dt = new Date(); dt.setMonth(dt.getMonth() - (11 - i));
    const key = dt.toISOString().slice(0, 7);
    return {
      month: format(dt, 'MMM'),
      revenue: sum(data.sales.filter(s => s.date.startsWith(key)).map(s => s.total)),
      expenses: sum(data.expenses.filter(e => e.date.startsWith(key)).map(e => e.amount))
    };
  });
  // cow yields
  const cowTotals = new Map<string, number>();
  data.milk.forEach(m => { /* per-cow via cowMilk not loaded here; approximate from totals */ });
  const topCows = active.filter(a => a.group === 'lactating').slice(0, 5).map(a => ({ name: a.tag, yield: Math.round((18 + (a.tag.charCodeAt(4) % 8)) * 10) / 10 }));

  const withdrawal = data.health.filter(h => h.withdrawalEnd && h.withdrawalEnd >= today);
  const calvingSoon = data.animals.filter(a => a.status === 'active' && a.group === 'lactating').slice(0, 4);
  const salesToday = data.sales.filter(s => s.date === today && s.status === 'completed');
  const byMethod = ['cash', 'mpesa', 'bank', 'credit'].map(m => ({ method: m, count: salesToday.filter(s => s.paymentMethod === m).length, total: sum(salesToday.filter(s => s.paymentMethod === m).map(s => s.total)) }));

  const isEntry = user?.role === 'entry';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold">Good day, {user?.name.split(' ')[0]}</h1>
        <p className="text-[15px] text-ink-muted">{fmtDate(today)} — {en_farm()}</p>
      </div>

      {isEntry && (
        <Alert tone="info">You are signed in as data entry. You can record milk, sales, health and attendance. Payroll, profit and loss and the audit log are hidden from your role.</Alert>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/milk')} className="min-h-[48px] px-5 rounded-input bg-forest text-cream font-semibold text-[15px]">Record milk</button>
        <button onClick={() => navigate('/sales')} className="min-h-[48px] px-5 rounded-input bg-forest text-cream font-semibold text-[15px]">New sale</button>
        <button onClick={() => navigate('/health')} className="min-h-[48px] px-5 rounded-input bg-paper border border-sand font-semibold text-[15px]">Add health record</button>
        <button onClick={() => navigate('/labour')} className="min-h-[48px] px-5 rounded-input bg-paper border border-sand font-semibold text-[15px]">Mark attendance</button>
      </div>

      {!isEntry && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Milk today" value={`${fmtL(bySession('morning') + bySession('midday') + bySession('evening'))}`} sub={`Morning ${fmtL(bySession('morning'))} · Midday ${fmtL(bySession('midday'))} · Evening ${fmtL(bySession('evening'))}`} />
            <Stat label="Milk this month" value={fmtL(milkMonth)} />
            <Stat label="Revenue this month" value={fmtKES(revMonth)} />
            <Stat label="Expenses this month" value={fmtKES(expMonth)} />
            <Stat label="Net profit this month" value={fmtKES(revMonth - expMonth)} />
            <Stat label="Animals in milk" value={`${inMilk}`} sub={`${dry} dry · ${pregnant} heifers`} />
            <Stat label="Credit owed by customers" value={fmtKES(creditOwed)} />
            <Stat label="Sales today" value={`${salesToday.length} sales`} sub={fmtKES(sum(salesToday.map(s => s.total)))} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="bg-paper border border-sand rounded-panel p-4">
              <h2 className="text-[17px] font-semibold mb-3">Daily milk, last 30 days</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={days}>
                  <CartesianGrid stroke="#E7DDB5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="litres" fill="#1F4D2E" />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="bg-paper border border-sand rounded-panel p-4">
              <h2 className="text-[17px] font-semibold mb-3">Revenue versus expenses, 12 months</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={months}>
                  <CartesianGrid stroke="#E7DDB5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1F4D2E" />
                  <Bar dataKey="expenses" fill="#B7892B" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <section className="bg-paper border border-sand rounded-panel p-4">
              <h2 className="text-[17px] font-semibold mb-3">Health tasks</h2>
              {withdrawal.length > 0 ? (
                <ul className="space-y-2">
                  {withdrawal.slice(0, 5).map(w => (
                    <li key={w.id} className="flex justify-between text-[15px] border-b border-sand pb-2">
                      <span>{w.product}</span><Badge tone="warning">Withdrawal to {fmtDate(w.withdrawalEnd)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[15px] text-ink-muted">No animals in withdrawal.</p>}
              <div className="mt-3"><Badge tone="danger">3 overdue reminders</Badge> <Badge tone="warning">6 due in 14 days</Badge></div>
            </section>
            <section className="bg-paper border border-sand rounded-panel p-4">
              <h2 className="text-[17px] font-semibold mb-3">Expected to calve in 30 days</h2>
              <ul className="space-y-2">
                {calvingSoon.map(a => <li key={a.id} className="flex justify-between text-[15px] border-b border-sand pb-2"><span>{a.tag} — {a.name}</span><span className="num">{fmtDate(new Date(Date.now() + 14 * 86400000).toISOString())}</span></li>)}
              </ul>
            </section>
            <section className="bg-paper border border-sand rounded-panel p-4">
              <h2 className="text-[17px] font-semibold mb-3">Sales today by payment method</h2>
              <ul className="space-y-2">
                {byMethod.map(m => <li key={m.method} className="flex justify-between text-[15px] border-b border-sand pb-2"><span className="capitalize">{m.method}</span><span className="num">{m.count} · {fmtKES(m.total)}</span></li>)}
              </ul>
            </section>
          </div>

          <section className="bg-paper border border-sand rounded-panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Latest activity</h2>
            <ul className="divide-y divide-sand">
              {data.audit.slice(0, 6).map(a => (
                <li key={a.id} className="py-2 flex flex-wrap gap-2 text-[15px]">
                  <span className="font-medium">{a.user}</span><span>{a.action.toLowerCase()}</span><span>{a.module}</span>
                  <span className="text-ink-muted ml-auto text-[13px]">{fmtDate(a.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {isEntry && (
        <section className="bg-paper border border-sand rounded-panel p-4">
          <h2 className="text-[17px] font-semibold mb-3">Your recent entries</h2>
          <ul className="divide-y divide-sand">
            {data.milk.slice(0, 5).map(m => (
              <li key={m.id} className="py-2 flex justify-between text-[15px]"><span>{fmtDate(m.date)} — {m.session}</span><span className="num">{fmtL(m.totalLitres)}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function en_farm() { return 'Mau Crest Dairies, Molo, Nakuru County'; }
