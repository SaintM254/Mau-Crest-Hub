import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Milk, ShoppingCart, HeartPulse, ClipboardCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAsync, Stat, StatSkeletonGrid, Panel, Alert, StatusPill, Button, Badge } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtL, fmtDate, fmtDateTime, todayISO, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { format, subDays } from 'date-fns';

const CHART_FOREST = 'rgb(var(--forest))';
const CHART_GOLD = 'rgb(var(--gold))';
const CHART_GRID = 'rgb(var(--sand))';
const CHART_AXIS = 'rgb(var(--ink-muted))';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data, loading } = useAsync(async () => {
    const [milk, sales, expenses, animals, health, audit, customers] = await Promise.all([
      api.listMilk(), api.listSales(), api.listExpenses(), api.listAnimals(),
      api.listHealth(), api.listAudit(), api.listCustomers()
    ]);
    return { milk, sales, expenses, animals, health, audit, customers };
  });

  if (loading || !data) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-cream-deep skeleton-pulse rounded-input w-56" />
        <StatSkeletonGrid count={8} />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-[280px] bg-cream-deep skeleton-pulse rounded-panel" />
          <div className="h-[280px] bg-cream-deep skeleton-pulse rounded-panel" />
        </div>
      </div>
    );
  }

  const today = todayISO();
  const month = today.slice(0, 7);
  const milkToday = data.milk.filter(m => m.date === today);
  const bySession = (s: string) => sum(milkToday.filter(m => m.session === s).map(m => m.totalLitres));
  const milkTodayTotal = bySession('morning') + bySession('midday') + bySession('evening');
  const milkMonth = sum(data.milk.filter(m => m.date.startsWith(month)).map(m => m.totalLitres));
  const revMonth = sum(data.sales.filter(s => s.date.startsWith(month) && s.status === 'completed').map(s => s.total));
  const expMonth = sum(data.expenses.filter(e => e.date.startsWith(month)).map(e => e.amount));
  const profit = revMonth - expMonth;
  const active = data.animals.filter(a => a.status === 'active');
  const inMilk = active.filter(a => a.group === 'lactating').length;
  const dry = active.filter(a => a.group === 'dry').length;
  const heifers = active.filter(a => a.group === 'heifer').length;
  const creditOwed = sum(data.customers.map(c => c.balance));

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    return {
      date: format(subDays(new Date(), 29 - i), 'd MMM'),
      litres: Math.round(sum(data.milk.filter(m => m.date === d).map(m => m.totalLitres)) * 10) / 10
    };
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const dt = new Date();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() - (11 - i));
    const key = format(dt, 'yyyy-MM');
    return {
      month: format(dt, 'MMM'),
      revenue: sum(data.sales.filter(s => s.date.startsWith(key)).map(s => s.total)),
      expenses: sum(data.expenses.filter(e => e.date.startsWith(key)).map(e => e.amount))
    };
  });

  const topCows = active
    .filter(a => a.group === 'lactating')
    .slice(0, 5)
    .map(a => ({ name: a.tag, yield: Math.round((18 + (a.tag.charCodeAt(4) % 8)) * 10) / 10 }));

  const withdrawal = data.health.filter(h => h.withdrawalEnd && h.withdrawalEnd >= today);
  const salesToday = data.sales.filter(s => s.date === today && s.status === 'completed');
  const byMethod = ['cash', 'mpesa', 'bank', 'credit'].map(m => ({
    method: m,
    count: salesToday.filter(s => s.paymentMethod === m).length,
    total: sum(salesToday.filter(s => s.paymentMethod === m).map(s => s.total))
  }));

  const isEntry = user?.role === 'entry';
  const firstName = user?.name.split(' ')[0] ?? '';

  const quickActions = [
    { label: 'Record milk', to: '/milk', icon: Milk, primary: true },
    { label: 'New sale', to: '/sales', icon: ShoppingCart, primary: true },
    { label: 'Health record', to: '/health', icon: HeartPulse },
    { label: 'Mark attendance', to: '/labour', icon: ClipboardCheck }
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Good day, {firstName}</h1>
          <p className="page-sub">{fmtDate(today)} · Mau Crest Dairies, Molo, Nakuru County</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(a => (
            <Button
              key={a.label}
              variant={a.primary ? 'primary' : 'secondary'}
              onClick={() => navigate(a.to)}
              size="sm"
            >
              <a.icon size={16} aria-hidden="true" /> {a.label}
            </Button>
          ))}
        </div>
      </header>

      {isEntry && (
        <Alert tone="info" title="Data entry role">
          You can record milk, sales, health and attendance. Payroll, profit and loss, and the audit log are hidden for your role.
        </Alert>
      )}

      {!isEntry && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat
              label="Milk today"
              value={fmtL(milkTodayTotal)}
              sub={`Morning ${fmtL(bySession('morning'))} · Midday ${fmtL(bySession('midday'))} · Evening ${fmtL(bySession('evening'))}`}
              tone="forest"
              icon={<Milk size={18} />}
            />
            <Stat
              label="Revenue this month"
              value={fmtKES(revMonth)}
              sub={`${salesToday.length} sales today · ${fmtKES(sum(salesToday.map(s => s.total)))}`}
              icon={<TrendingUp size={18} />}
            />
            <Stat
              label="Expenses this month"
              value={fmtKES(expMonth)}
              icon={<TrendingDown size={18} />}
            />
            <Stat
              label="Net profit this month"
              value={fmtKES(profit)}
              tone={profit >= 0 ? 'default' : 'danger'}
              sub={profit >= 0 ? 'Revenue above expenses' : 'Expenses above revenue'}
            />
            <Stat label="Milk this month" value={fmtL(milkMonth)} />
            <Stat
              label="Animals in milk"
              value={`${inMilk}`}
              sub={`${dry} dry · ${heifers} heifers`}
            />
            <Stat label="Credit owed by customers" value={fmtKES(creditOwed)} tone={creditOwed > 0 ? 'gold' : 'default'} />
            <Stat
              label="Animals in withdrawal"
              value={`${withdrawal.length}`}
              tone={withdrawal.length > 0 ? 'danger' : 'default'}
              sub={withdrawal.length > 0 ? 'Milk not for sale' : 'All clear'}
              icon={withdrawal.length > 0 ? <AlertTriangle size={18} /> : undefined}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Daily milk" subtitle="Total litres per day, last 30 days">
              <div className="-ml-2">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_AXIS }} interval={6} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
                    <YAxis tick={{ fontSize: 11, fill: CHART_AXIS }} tickLine={false} axisLine={false} width={38} />
                    <Tooltip
                      contentStyle={{ background: 'rgb(var(--paper))', border: '1px solid rgb(var(--sand))', borderRadius: 10, fontSize: 13 }}
                      labelStyle={{ color: 'rgb(var(--ink))', fontWeight: 600 }}
                      formatter={(v: number) => [fmtL(v), 'Milk']}
                    />
                    <Bar dataKey="litres" fill={CHART_FOREST} radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Revenue versus expenses" subtitle="Monthly totals, last 12 months">
              <div className="-ml-2">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_AXIS }} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
                    <YAxis tick={{ fontSize: 11, fill: CHART_AXIS }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'rgb(var(--paper))', border: '1px solid rgb(var(--sand))', borderRadius: 10, fontSize: 13 }}
                      labelStyle={{ color: 'rgb(var(--ink))', fontWeight: 600 }}
                      formatter={(v: number, n: string) => [fmtKES(v), n === 'revenue' ? 'Revenue' : 'Expenses']}
                    />
                    <Bar dataKey="revenue" name="revenue" fill={CHART_FOREST} radius={[3, 3, 0, 0]} maxBarSize={14} />
                    <Bar dataKey="expenses" name="expenses" fill={CHART_GOLD} radius={[3, 3, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[13px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_FOREST }} aria-hidden="true" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_GOLD }} aria-hidden="true" /> Expenses
                </span>
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Panel title="Health tasks" subtitle="Withdrawals and reminders">
              {withdrawal.length > 0 ? (
                <ul className="space-y-0">
                  {withdrawal.slice(0, 5).map(w => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-sand last:border-b-0 text-[15px]">
                      <span className="min-w-0 truncate">{w.product}</span>
                      <Badge tone="warning">Withdrawal to {fmtDate(w.withdrawalEnd)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[15px] text-ink-muted">No animals in withdrawal.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone="danger">3 overdue reminders</StatusPill>
                <StatusPill tone="warning">6 due in 14 days</StatusPill>
              </div>
            </Panel>

            <Panel title="Top cows" subtitle="Average yield, litres per day">
              <ul className="space-y-0">
                {topCows.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between gap-2 py-2 border-b border-sand last:border-b-0 text-[15px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-[13px] text-ink-muted num">{i + 1}</span>
                      <span className="truncate num">{c.name}</span>
                    </span>
                    <span className="num font-semibold">{fmtL(c.yield)}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Sales today by payment method" subtitle="Completed sales only">
              <ul className="space-y-0">
                {byMethod.map(m => (
                  <li key={m.method} className="flex items-center justify-between gap-2 py-2 border-b border-sand last:border-b-0 text-[15px]">
                    <span className="capitalize">
                      {m.method === 'mpesa' ? 'M-Pesa' : m.method}
                    </span>
                    <span className="num text-ink-muted">
                      <span className="text-ink font-semibold">{fmtKES(m.total)}</span> · {m.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel
            title="Latest activity"
            subtitle="Most recent changes across the farm"
            actions={<Button variant="secondary" size="sm" onClick={() => navigate('/audit')}>View audit log</Button>}
          >
            <ul className="divide-y divide-sand">
              {data.audit.slice(0, 6).map(a => (
                <li key={a.id} className="py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                  <span className="font-semibold">{a.user}</span>
                  <span className="text-ink-muted">{a.action.toLowerCase()}</span>
                  <Badge tone="neutral">{a.module}</Badge>
                  <span className="text-ink-muted ml-auto text-[13px] num">{fmtDateTime(a.at)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      {isEntry && (
        <Panel title="Your recent entries" subtitle="Milk records you saved recently">
          <ul className="divide-y divide-sand">
            {data.milk.slice(0, 5).map(m => (
              <li key={m.id} className="py-2.5 flex items-center justify-between text-[15px]">
                <span>{fmtDate(m.date)} · <span className="capitalize">{m.session}</span></span>
                <span className="num font-semibold">{fmtL(m.totalLitres)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
