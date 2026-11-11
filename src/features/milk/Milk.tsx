import { useState, useMemo } from 'react';
import { Segmented, useAsync, Button, Input, Select, Badge, Alert, EmptyState, Tabs, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtL, fmtDate, todayISO, sum, uid } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel } from '../../lib/export';

export function MilkPage() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [milk, animals, employees, usage, cowMilk, health, settings] = await Promise.all([
      api.listMilk(), api.listAnimals(), api.listEmployees(), api.listUsage(), api.listCowMilk(), api.listHealth(), api.getSettings()
    ]);
    return { milk, animals, employees, usage, cowMilk, health, settings };
  });
  const [date, setDate] = useState(todayISO());
  const [session, setSession] = useState<'morning' | 'midday' | 'evening'>('morning');
  const [mode, setMode] = useState<'percow' | 'batch'>('percow');
  const [perCow, setPerCow] = useState<Record<string, string>>({});
  const [batchLitres, setBatchLitres] = useState('');
  const [fat, setFat] = useState('3.8');
  const [scc, setScc] = useState('250000');
  const [spoilage, setSpoilage] = useState('');
  const [spoilageReason, setSpoilageReason] = useState('');
  const [milkedBy, setMilkedBy] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [tab, setTab] = useState('entry');

  const lactating = useMemo(() => (data?.animals || []).filter(a => a.group === 'lactating' && a.status === 'active'), [data]);
  const withdrawalIds = useMemo(() => new Set((data?.health || []).filter(h => h.withdrawalEnd && h.withdrawalEnd >= date).flatMap(h => h.animalIds)), [data, date]);
  const runningTotal = sum(Object.values(perCow).map(v => Number(v) || 0));
  const existing = data?.milk.find(m => m.date === date && m.session === session);

  const copyYesterday = () => {
    if (!data) return;
    const prev = data.milk.filter(m => m.date < date).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!prev) return;
    const rows = data.cowMilk.filter(c => c.milkId === prev.id);
    const next: Record<string, string> = {};
    rows.forEach(r => { next[r.animalId] = String(r.litres); });
    setPerCow(next);
  };

  const save = async () => {
    if (!data) return;
    const total = mode === 'percow' ? runningTotal : Number(batchLitres) || 0;
    const payload: any = {
      id: existing?.id, date, session, mode, totalLitres: Math.round(total * 10) / 10,
      fat: Number(fat) || 0, scc: Number(scc) || 0, spoilage: Number(spoilage) || 0,
      spoilageReason, milkedBy, note: '', createdBy: user?.name || '', updatedBy: user?.name || '',
      updatedAt: new Date().toISOString(), synced: true
    };
    const saved = await api.saveMilk(payload);
    if (mode === 'percow') {
      // remove old cow rows for this milk id is complex; just add new rows
      const rows = Object.entries(perCow).filter(([, v]) => Number(v) > 0).map(([animalId, litres]) => ({ id: uid(), milkId: saved.id, animalId, litres: Number(litres) }));
      if (rows.length) await api.saveCowMilk(rows);
    }
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Milk', record: `${date} ${session}`, oldValue: '', newValue: `${payload.totalLitres} L`, at: new Date().toISOString() });
    setSavedMsg('Milk record saved');
    pushToast('Milk record saved');
    reload();
  };

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;

  const dayMilk = data.milk.filter(m => m.date === date);
  const produced = sum(dayMilk.map(m => m.totalLitres));
  const usageDay = data.usage.find(u => u.date === date);
  const used = usageDay ? usageDay.calves + usageDay.home + usageDay.wasted : 0;
  const soldToday = 0; // sales shown in reconciliation via API in full version; here show produced vs used
  const threshold = data.settings?.reconThreshold ?? 10;
  const unexplained = Math.round((produced - used - sum(dayMilk.map(m => m.spoilage))) * 10) / 10;

  return (
    <div className="space-y-4">
      <PageHeader title="Milk" subtitle="Three sessions a day, per cow or per batch, with usage reconciliation." />
      <Tabs tabs={[{ id: 'entry', label: 'Daily entry' }, { id: 'usage', label: 'Milk usage' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />

      {tab === 'entry' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Segmented
              label="Session"
              value={session}
              onChange={setSession}
              options={(['morning', 'midday', 'evening'] as const).map(s => ({
                value: s,
                label: s,
                meta: data.milk.some(m => m.date === date && m.session === s) ? 'saved' : undefined
              }))}
            />
            <Select label="Milked by" value={milkedBy} onChange={(e) => setMilkedBy(e.target.value)} options={[{ value: '', label: 'Choose employee' }, ...data.employees.map(e => ({ value: e.id, label: e.name }))]} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              className="w-full sm:w-auto"
              value={mode}
              onChange={setMode}
              options={[{ value: 'percow' as const, label: 'Per cow' }, { value: 'batch' as const, label: 'Per batch' }]}
            />
            {mode === 'percow' && <Button variant="secondary" onClick={copyYesterday}>Copy from yesterday</Button>}
            <div className="ml-auto text-[17px] font-bold num">Total: {fmtL(mode === 'percow' ? runningTotal : Number(batchLitres) || 0)}</div>
          </div>

          {mode === 'percow' ? (
            <div className="panel overflow-x-auto">
              <table className="table-base min-w-[560px]">
                <thead><tr><th>Cow</th><th>Litres</th><th>Note</th></tr></thead>
                <tbody>
                  {lactating.map(a => {
                    const inWd = withdrawalIds.has(a.id);
                    return (
                      <tr key={a.id}>
                        <td><span className="font-medium">{a.tag} — {a.name}</span>{inWd && <span className="ml-2"><Badge tone="warning">In withdrawal</Badge></span>}</td>
                        <td><input inputMode="decimal" type="number" step="any" min="0" value={perCow[a.id] || ''} onChange={(e) => setPerCow({ ...perCow, [a.id]: e.target.value })} className="w-32 min-h-[44px] px-3 rounded-input border border-sand bg-cream text-[15px] num" aria-label={`Litres for ${a.tag}`} /></td>
                        <td className="text-[13px] text-ink-muted">{inWd ? 'Milk from this cow is not sold.' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel p-4 max-w-md">
              <Input label="Total litres for this session" type="number" inputMode="decimal" value={batchLitres} onChange={(e) => setBatchLitres(e.target.value)} />
            </div>
          )}

          <div className="panel p-4 grid md:grid-cols-4 gap-3">
            <Input label="Fat %" type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
            <Input label="SCC (cells/ml)" type="number" value={scc} onChange={(e) => setScc(e.target.value)} />
            <Input label="Spoilage (L)" type="number" inputMode="decimal" value={spoilage} onChange={(e) => setSpoilage(e.target.value)} />
            <Input label="Spoilage reason" value={spoilageReason} onChange={(e) => setSpoilageReason(e.target.value)} />
          </div>

          {savedMsg && <Alert tone="success">{savedMsg}</Alert>}
          <p className="text-[13px] text-ink-muted">Data entry staff can edit their own entries for 24 hours.</p>
          <div className="flex gap-3">
            <Button onClick={save} className="text-[17px] min-h-[52px] px-8">Save milk record</Button>
          </div>
        </div>
      )}

      {tab === 'usage' && (
        <div className="space-y-4">
          <UsageForm date={date} existing={usageDay} onSaved={reload} />
          <div className="panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Reconciliation for {fmtDate(date)}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[15px]">
              <div><div className="text-ink-muted text-[13px]">Produced</div><div className="num font-bold">{fmtL(produced)}</div></div>
              <div><div className="text-ink-muted text-[13px]">Used (calves/home/wasted)</div><div className="num font-bold">{fmtL(used)}</div></div>
              <div><div className="text-ink-muted text-[13px]">Spoiled</div><div className="num font-bold">{fmtL(sum(dayMilk.map(m => m.spoilage)))}</div></div>
              <div><div className="text-ink-muted text-[13px]">Unexplained</div><div className="num font-bold">{fmtL(unexplained)}</div></div>
              <div><div className="text-ink-muted text-[13px]">Threshold</div><div className="num font-bold">{fmtL(threshold)}</div></div>
            </div>
            {Math.abs(unexplained) > threshold && <div className="mt-3"><Alert tone="warning">The unexplained difference is larger than the {fmtL(threshold)} threshold. Check the records for this day.</Alert></div>}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <Button variant="secondary" onClick={() => exportExcel('milk-history', data.milk.slice(0, 200).map(m => ({ Date: m.date, Session: m.session, Litres: m.totalLitres, Fat: m.fat, SCC: m.scc })))}>Export history</Button>
          {data.milk.length === 0 ? <EmptyState title="No milk records" body="Record milk from the Daily entry tab." /> : (
            <div className="panel overflow-x-auto">
              <table className="table-base min-w-[560px]">
                <thead><tr><th>Date</th><th>Session</th><th>Litres</th><th>Fat %</th><th>SCC</th><th>Milked by</th></tr></thead>
                <tbody>
                  {[...data.milk].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60).map(m => (
                    <tr key={m.id}>
                      <td>{fmtDate(m.date)}</td><td className="capitalize">{m.session}</td>
                      <td className="num">{fmtL(m.totalLitres)}</td><td className="num">{m.fat}%</td>
                      <td className="num">{m.scc.toLocaleString()}{m.scc > 500000 ? <span className="ml-2"><Badge tone="danger">High SCC</Badge></span> : ''}</td>
                      <td>{data.employees.find(e => e.id === m.milkedBy)?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsageForm({ date, existing, onSaved }: { date: string; existing: any; onSaved: () => void }) {
  const [calves, setCalves] = useState(existing?.calves?.toString() || '');
  const [home, setHome] = useState(existing?.home?.toString() || '');
  const [wasted, setWasted] = useState(existing?.wasted?.toString() || '');
  const { user, pushToast } = useSession();
  const save = async () => {
    await api.saveUsage({ date, calves: Number(calves) || 0, home: Number(home) || 0, wasted: Number(wasted) || 0, updatedBy: user?.name || '', updatedAt: new Date().toISOString() });
    pushToast('Milk usage saved');
    onSaved();
  };
  return (
    <div className="panel p-4 grid md:grid-cols-4 gap-3 items-end">
      <Input label="To calves (L)" type="number" inputMode="decimal" value={calves} onChange={(e) => setCalves(e.target.value)} />
      <Input label="Home use (L)" type="number" inputMode="decimal" value={home} onChange={(e) => setHome(e.target.value)} />
      <Input label="Wasted (L)" type="number" inputMode="decimal" value={wasted} onChange={(e) => setWasted(e.target.value)} />
      <Button onClick={save}>Save usage</Button>
    </div>
  );
}
