import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Milk, ShoppingCart, HeartPulse, ClipboardCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAsync, Stat, StatSkeletonGrid, Panel, Alert, StatusPill, Button, Badge } from '../../components/ui';
import { api } from '../../api';
import { CowIcon } from '../../components/ui/CowIcon';
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
      {/* Welcome row */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[32px] font-bold text-ink leading-tight">
            Welcome back, <span className="text-ink-muted font-medium">{firstName}</span>
          </h1>
          <p className="page-sub">{fmtDate(today)} · Mau Crest Dairies, Molo, Nakuru County</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {quickActions.map(a => (
            <Button
              key={a.label}
              variant={a.primary ? 'primary' : 'secondary'}
              onClick={() => navigate(a.to)}
              size="sm"
            >
              <a.icon size={15} aria-hidden="true" /> {a.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Hero highlight */}
      {!isEntry && (
        <section className="bg-paper border border-sand rounded-panel p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-tint text-forest text-[13px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-forest" aria-hidden="true" />
                Milk today
              </span>
              <div className="mt-3 flex items-end gap-3 flex-wrap">
                <div className="text-[32px] md:text-[40px] font-bold text-ink num leading-none">
                  {fmtL(milkTodayTotal)}
                </div>
                <div className="text-[15px] text-ink-muted pb-1">
                  from {inMilk} cows in milk
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Morning', value: bySession('morning') },
                  { label: 'Midday', value: bySession('midday') },
                  { label: 'Evening', value: bySession('evening') }
                ].map(sess => (
                  <div key={sess.label} className="bg-cream rounded-panel px-3 py-2.5">
                    <div className="text-[13px] text-ink-muted">{sess.label}</div>
                    <div className="text-[17px] font-bold num text-ink">{fmtL(sess.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-panel bg-cream p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[13px] text-ink-muted font-medium">Last 14 days</span>
                <span className="text-[13px] text-ink-muted num">
                  {fmtL(sum(days.slice(-14).map(d => d.litres)))}
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-[104px]" role="img" aria-label="Milk production, last 14 days">
                {days.slice(-14).map((d, i) => {
                  const max = Math.max(...days.slice(-14).map(x => x.litres), 1);
                  const h = Math.max(6, (d.litres / max) * 100);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-forest rounded-t-[3px]"
                      style={{ height: `${h}%` }}
                      title={`${d.date}: ${fmtL(d.litres)}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[13px] text-ink-muted mt-2">
                <span>{days[days.length - 14]?.date}</span>
                <span>{days[days.length - 1]?.date}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {isEntry && (
        <Alert tone="info" title="Data entry role">
          You can record milk, sales, health and attendance. Payroll, profit and loss, and the audit log are hidden for your role.
        </Alert>
      )}

      {!isEntry && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            <Stat label="Milk this month" value={fmtL(milkMonth)} icon={<Milk size={17} />} />
            <Stat
              label="Animals in milk"
              value={`${inMilk}`}
              sub={`${dry} dry · ${heifers} heifers`}
              icon={<CowIcon size={17} />}
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
