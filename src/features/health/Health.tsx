import { useState } from 'react';
import { useAsync, Button, Input, Select, Dialog, Badge, Alert, EmptyState, FileDropzone, Tabs } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, todayISO } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel } from '../../lib/export';

const TYPES = ['Vaccination', 'Treatment', 'Deworming', 'Vet visit', 'Test'];
const PRODUCTS: Record<string, string[]> = {
  Vaccination: ['Foot and mouth vaccine', 'Lumpy skin disease vaccine', 'Brucellosis vaccine', 'East Coast fever vaccine'],
  Treatment: ['Oxytetracycline 20%', 'Penicillin G', 'Ivermectin', 'Mastitis tube'],
  Deworming: ['Albendazole 10%', 'Levamisole'],
  'Vet visit': ['General check-up', 'Pregnancy examination'],
  Test: ['CMT test', 'TB test', 'Brucellosis test']
};

export function HealthPage() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [health, animals, employees, vets] = await Promise.all([api.listHealth(), api.listAnimals(), api.listEmployees(), api.listVets()]);
    return { health, animals, employees, vets };
  });
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ date: todayISO(), type: 'Vaccination', animalIds: [] as string[], product: 'Foot and mouth vaccine', dose: '10 ml', route: 'Intramuscular', administeredBy: '', cost: '', notes: '', milkWithdrawalDays: 0, meatWithdrawalDays: 0, attachments: [] as string[] });
  const [searchAnimal, setSearchAnimal] = useState('');

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;

  const withdrawal = data.health.filter(h => h.withdrawalEnd && h.withdrawalEnd >= todayISO());
  const withdrawalAnimals = new Set(withdrawal.flatMap(h => h.animalIds));

  const save = async () => {
    const wd = Number(form.milkWithdrawalDays) || 0;
    const end = wd > 0 ? new Date(new Date(form.date).getTime() + wd * 86400000).toISOString().slice(0, 10) : '';
    await api.saveHealth({ ...form, cost: Number(form.cost) || 0, milkWithdrawalDays: wd, meatWithdrawalDays: Number(form.meatWithdrawalDays) || 0, withdrawalEnd: end, createdBy: user?.name, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Health', record: form.product, oldValue: '', newValue: `${form.animalIds.length} animals`, at: new Date().toISOString() });
    setOpen(false); pushToast('Health record saved'); reload();
  };

  const toggleAnimal = (id: string) => {
    setForm({ ...form, animalIds: form.animalIds.includes(id) ? form.animalIds.filter((x: string) => x !== id) : [...form.animalIds, id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold">Health</h1>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => exportExcel('health', data.health.map(h => ({ Date: h.date, Type: h.type, Product: h.product, Animals: h.animalIds.length, Cost: h.cost })))}>Export</Button>
        <Button onClick={() => setOpen(true)}>Add health record</Button>
      </div>
      <Tabs tabs={[{ id: 'records', label: 'Records' }, { id: 'withdrawal', label: 'Withdrawal control' }, { id: 'reminders', label: 'Reminders' }, { id: 'vets', label: 'Vets' }]} active={tab} onChange={setTab} />

      {tab === 'records' && (
        data.health.length === 0 ? <EmptyState title="No health records" body="Add vaccinations, treatments and tests here." action={<Button onClick={() => setOpen(true)}>Add health record</Button>} /> : (
          <div className="bg-paper border border-sand rounded-panel overflow-x-auto">
            <table className="w-full text-[15px] min-w-[720px]">
              <thead><tr className="bg-cream-deep text-left"><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Product</th><th className="p-3">Animals</th><th className="p-3">By</th><th className="p-3">Cost</th><th className="p-3">Withdrawal</th></tr></thead>
              <tbody>
                {[...data.health].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60).map(h => (
                  <tr key={h.id} className="border-t border-sand">
                    <td className="p-3">{fmtDate(h.date)}</td><td className="p-3"><Badge tone="neutral">{h.type}</Badge></td>
                    <td className="p-3">{h.product}</td><td className="p-3 num">{h.animalIds.length}</td>
                    <td className="p-3">{h.administeredBy}</td><td className="p-3 num">{fmtKES(h.cost)}</td>
                    <td className="p-3">{h.withdrawalEnd ? <Badge tone="warning">To {fmtDate(h.withdrawalEnd)}</Badge> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'withdrawal' && (
        <div className="space-y-3">
          {withdrawalAnimals.size === 0 ? <EmptyState title="No animals in withdrawal" body="Animals in milk withdrawal will be listed here." /> : (
            <div className="bg-paper border border-sand rounded-panel p-4">
              <Alert tone="warning">Milk from these animals must not be sold. The milk entry screen marks them.</Alert>
              <ul className="mt-3 divide-y divide-sand">
                {[...withdrawalAnimals].map(id => {
                  const a = data.animals.find(x => x.id === id);
                  const h = withdrawal.find(x => x.animalIds.includes(id));
                  return <li key={id} className="py-2 flex flex-wrap gap-2 text-[15px]"><span className="font-medium">{a?.tag} — {a?.name}</span><Badge tone="warning">Withdrawal to {h ? fmtDate(h.withdrawalEnd) : ''}</Badge></li>;
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'reminders' && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-paper border border-sand rounded-panel p-4"><h3 className="font-semibold text-[15px] mb-2">Overdue (3)</h3><ul className="text-[15px] space-y-1"><li>Foot and mouth booster — 12 animals</li><li>Deworming round — dry cows</li><li>CMT test — lactating group</li></ul></div>
          <div className="bg-paper border border-sand rounded-panel p-4"><h3 className="font-semibold text-[15px] mb-2">Due this week</h3><ul className="text-[15px] space-y-1"><li>Vaccination — calves</li><li>TB test — bulls</li></ul></div>
          <div className="bg-paper border border-sand rounded-panel p-4"><h3 className="font-semibold text-[15px] mb-2">Due in 14 days (6)</h3><ul className="text-[15px] space-y-1"><li>Pregnancy checks — 8 cows</li><li>Vet visit — general check</li></ul></div>
        </div>
      )}

      {tab === 'vets' && (
        <div className="bg-paper border border-sand rounded-panel overflow-x-auto">
          <table className="w-full text-[15px]"><thead><tr className="bg-cream-deep text-left"><th className="p-3">Name</th><th className="p-3">Clinic</th><th className="p-3">Phone</th></tr></thead>
          <tbody>{data.vets.map(v => <tr key={v.id} className="border-t border-sand"><td className="p-3">{v.name}</td><td className="p-3">{v.clinic}</td><td className="p-3 num">{v.phone}</td></tr>)}</tbody></table>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Add health record" wide>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select label="Record type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, product: PRODUCTS[e.target.value][0] })} options={TYPES.map(t => ({ value: t, label: t }))} />
            <Select label="Product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} options={PRODUCTS[form.type].map(p => ({ value: p, label: p }))} />
            <Input label="Dose" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />
            <Input label="Route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
            <Select label="Administered by" value={form.administeredBy} onChange={(e) => setForm({ ...form, administeredBy: e.target.value })} options={[{ value: '', label: 'Choose' }, ...data.employees.map(e => ({ value: e.name, label: e.name })), ...data.vets.map(v => ({ value: v.name, label: v.name }))]} />
            <Input label="Cost (KES)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="Milk withdrawal days" type="number" value={form.milkWithdrawalDays} onChange={(e) => setForm({ ...form, milkWithdrawalDays: e.target.value })} hint={form.milkWithdrawalDays > 0 ? `Ends ${fmtDate(new Date(new Date(form.date).getTime() + Number(form.milkWithdrawalDays) * 86400000).toISOString())}` : '0 means no withdrawal.'} />
            <Input label="Meat withdrawal days" type="number" value={form.meatWithdrawalDays} onChange={(e) => setForm({ ...form, meatWithdrawalDays: e.target.value })} />
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div>
            <span className="block text-[15px] font-medium mb-1">Animals (search and tick)</span>
            <input value={searchAnimal} onChange={(e) => setSearchAnimal(e.target.value)} placeholder="Search tag or name" className="w-full min-h-[44px] px-3 rounded-input border border-sand bg-paper text-[15px] mb-2" />
            <div className="max-h-40 overflow-y-auto border border-sand rounded-panel p-2">
              {data.animals.filter(a => a.status === 'active' && (a.tag.toLowerCase().includes(searchAnimal.toLowerCase()) || a.name.toLowerCase().includes(searchAnimal.toLowerCase()))).slice(0, 30).map(a => (
                <label key={a.id} className="flex items-center gap-2 min-h-[44px] px-2 cursor-pointer">
                  <input type="checkbox" checked={form.animalIds.includes(a.id)} onChange={() => toggleAnimal(a.id)} className="w-5 h-5 accent-[#1F4D2E]" />
                  <span className="text-[15px]">{a.tag} — {a.name}</span>
                </label>
              ))}
            </div>
            <p className="text-[13px] text-ink-muted mt-1">{form.animalIds.length} animals selected.</p>
          </div>
          <FileDropzone onFiles={(names) => setForm({ ...form, attachments: [...form.attachments, ...names] })} />
          {form.attachments.length > 0 && <p className="text-[13px] text-ink-muted">Attached: {form.attachments.join(', ')}</p>}
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save health record</Button></div>
        </div>
      </Dialog>
    </div>
  );
}
