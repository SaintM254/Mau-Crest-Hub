import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync, Button, Input, Select, Dialog, SearchBar, Pagination, EmptyState, Badge, Alert, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, ageYears, todayISO, uid } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel } from '../../lib/export';
import { z } from 'zod';

const schema = z.object({
  tag: z.string().min(4, 'Tag must be at least 4 characters, for example MC-001.'),
  name: z.string().min(1, 'Name is required.'),
  breed: z.string().min(1, 'Breed is required.'),
  sex: z.enum(['F', 'M']),
  dob: z.string().min(1, 'Date of birth is required.'),
  group: z.string().min(1, 'Group is required.')
});

export function LivestockList() {
  const { user } = useSession();
  const { data, loading, reload } = useAsync(() => api.listAnimals());
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [breed, setBreed] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusDialog, setStatusDialog] = useState<any>(null);
  const [statusForm, setStatusForm] = useState<any>({});

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;

  const breeds = [...new Set(data.map(a => a.breed))];
  let filtered = data.filter(a =>
    (group === 'all' || a.group === group) &&
    (breed === 'all' || a.breed === breed) &&
    (status === 'all' || a.status === status) &&
    (a.tag.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()))
  );
  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * 20, page * 20);

  const openAdd = () => {
    setEditing(null);
    setForm({ tag: 'MC-' + String(data.length + 1).padStart(3, '0'), name: '', breed: 'Friesian', sex: 'F', dob: '', motherTag: '', fatherTag: '', source: 'born', purchaseDate: '', purchasePrice: '', group: 'calf', notes: '' });
    setErrors({}); setOpen(true);
  };
  const openEdit = (a: any) => { setEditing(a); setForm({ ...a, purchasePrice: a.purchasePrice ?? '' }); setErrors({}); setOpen(true); };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach(i => { e[String(i.path[0])] = i.message; });
      setErrors(e); return;
    }
    const dup = data.find(a => a.tag === form.tag && a.id !== editing?.id);
    if (dup) { setErrors({ tag: 'This tag number is already in use. Choose a different tag.' }); return; }
    const payload = { ...form, purchasePrice: form.source === 'purchased' ? Number(form.purchasePrice) || 0 : null, updatedBy: user?.name || '', updatedAt: new Date().toISOString() };
    await api.saveAnimal(payload);
    await api.addAudit({ user: user?.name, action: editing ? 'Edited' : 'Created', module: 'Livestock', record: form.tag, oldValue: editing ? 'Edited' : 'New animal', newValue: form.name, at: new Date().toISOString() });
    setOpen(false); reload();
  };

  const applyStatus = async () => {
    const payload = { ...statusDialog, status: statusForm.status, statusDate: statusForm.date || todayISO(), statusDetail: statusForm.detail, exitBuyer: statusForm.buyer, exitPrice: Number(statusForm.price) || 0, exitCause: statusForm.cause, exitDestination: statusForm.dest, updatedBy: user?.name, updatedAt: new Date().toISOString() };
    await api.saveAnimal(payload);
    await api.addAudit({ user: user?.name, action: 'Status changed', module: 'Livestock', record: statusDialog.tag, oldValue: 'active', newValue: statusForm.status, at: new Date().toISOString() });
    setStatusDialog(null); reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Livestock"
        subtitle="Every animal on the farm with breeding, milk and health records."
        actions={<>
          <span className="text-[15px] text-ink-muted num">{total} animals</span>
          <Button variant="secondary" onClick={() => exportExcel('livestock', filtered.map(a => ({ Tag: a.tag, Name: a.name, Breed: a.breed, Group: a.group, Status: a.status })))}>Export current view</Button>
          <Button onClick={openAdd}>Add animal</Button>
        </>}
      />

      <div className="grid md:grid-cols-4 gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Search by tag or name" />
        <Select value={group} onChange={(e) => setGroup(e.target.value)} options={[{ value: 'all', label: 'All groups' }, { value: 'lactating', label: 'Lactating' }, { value: 'dry', label: 'Dry' }, { value: 'heifer', label: 'Heifer' }, { value: 'calf', label: 'Calf' }, { value: 'bull', label: 'Bull' }]} />
        <Select value={breed} onChange={(e) => setBreed(e.target.value)} options={[{ value: 'all', label: 'All breeds' }, ...breeds.map(b => ({ value: b, label: b }))]} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'sold', label: 'Sold' }, { value: 'died', label: 'Died' }, { value: 'transferred', label: 'Transferred' }]} />
      </div>

      {pageRows.length === 0 ? (
        <EmptyState title="No animals found" body="Try a different search or filter, or add a new animal." action={<Button onClick={openAdd}>Add animal</Button>} />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base min-w-[720px]">
            <thead><tr>
              <th>Tag</th><th>Name</th><th>Breed</th><th>Group</th><th>Age</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {pageRows.map(a => (
                <tr key={a.id}>
                  <td><span className="inline-flex items-center gap-2"><span className="w-8 h-8 rounded-input inline-flex items-center justify-center text-white text-[11px] font-bold" style={{ background: a.photoColor }}>{a.tag.slice(3)}</span><Link to={`/livestock/${a.id}`} className="text-forest font-semibold underline">{a.tag}</Link></span></td>
                  <td>{a.name}</td>
                  <td>{a.breed}</td>
                  <td className="capitalize">{a.group}</td>
                  <td className="num">{ageYears(a.dob)}</td>
                  <td><Badge tone={a.status === 'active' ? 'success' : a.status === 'sold' ? 'info' : a.status === 'died' ? 'danger' : 'warning'}>{a.status}</Badge></td>
                  <td className="whitespace-nowrap">
                    <button className="text-forest font-semibold min-h-[44px] px-2" onClick={() => openEdit(a)}>Edit</button>
                    {a.status === 'active' && <button className="text-forest font-semibold min-h-[44px] px-2" onClick={() => { setStatusDialog(a); setStatusForm({ status: 'sold', date: todayISO(), buyer: '', price: '', cause: '', dest: '', detail: '' }); }}>Change status</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} onPage={setPage} />

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Edit animal' : 'Add animal'} wide>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Tag number" value={form.tag || ''} onChange={(e) => setForm({ ...form, tag: e.target.value })} error={errors.tag} />
          <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Select label="Breed" value={form.breed || 'Friesian'} onChange={(e) => setForm({ ...form, breed: e.target.value })} options={['Friesian', 'Ayrshire', 'Jersey', 'Guernsey', 'Friesian-Jersey cross'].map(b => ({ value: b, label: b }))} />
          <Select label="Sex" value={form.sex || 'F'} onChange={(e) => setForm({ ...form, sex: e.target.value })} options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }]} />
          <Input label="Date of birth" type="date" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} error={errors.dob} hint={form.dob ? `Age: ${ageYears(form.dob)}` : ''} />
          <Select label="Group" value={form.group || 'calf'} onChange={(e) => setForm({ ...form, group: e.target.value })} options={[{ value: 'lactating', label: 'Lactating' }, { value: 'dry', label: 'Dry' }, { value: 'heifer', label: 'Heifer' }, { value: 'calf', label: 'Calf' }, { value: 'bull', label: 'Bull' }]} />
          <Input label="Mother tag" value={form.motherTag || ''} onChange={(e) => setForm({ ...form, motherTag: e.target.value })} />
          <Input label="Father / sire tag" value={form.fatherTag || ''} onChange={(e) => setForm({ ...form, fatherTag: e.target.value })} />
          <Select label="Source" value={form.source || 'born'} onChange={(e) => setForm({ ...form, source: e.target.value })} options={[{ value: 'born', label: 'Born on farm' }, { value: 'purchased', label: 'Purchased' }]} />
          {form.source === 'purchased' && (
            <>
              <Input label="Purchase date" type="date" value={form.purchaseDate || ''} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
              <Input label="Purchase price (KES)" type="number" value={form.purchasePrice || ''} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
            </>
          )}
        </div>
        <div className="mt-4"><Input label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save animal</Button>
        </div>
      </Dialog>

      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} title={`Change status — ${statusDialog?.tag || ''}`}>
        <div className="space-y-4">
          <Select label="New status" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} options={[{ value: 'sold', label: 'Sold' }, { value: 'died', label: 'Died' }, { value: 'transferred', label: 'Transferred' }]} />
          <Input label="Date" type="date" value={statusForm.date} onChange={(e) => setStatusForm({ ...statusForm, date: e.target.value })} />
          {statusForm.status === 'sold' && (<><Input label="Buyer" value={statusForm.buyer} onChange={(e) => setStatusForm({ ...statusForm, buyer: e.target.value })} /><Input label="Sale price (KES)" type="number" value={statusForm.price} onChange={(e) => setStatusForm({ ...statusForm, price: e.target.value })} /></>)}
          {statusForm.status === 'died' && <Input label="Cause of death" value={statusForm.cause} onChange={(e) => setStatusForm({ ...statusForm, cause: e.target.value })} />}
          {statusForm.status === 'transferred' && <Input label="Destination" value={statusForm.dest} onChange={(e) => setStatusForm({ ...statusForm, dest: e.target.value })} />}
          <Alert tone="warning">This will update the animal status everywhere. The change is recorded in the audit log.</Alert>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button onClick={applyStatus}>Save status change</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export function AnimalProfile() {
  const { id } = (window as any).__routeParams || {};
  return <AnimalProfileInner id={id} />;
}

export function AnimalProfileInner({ id }: { id: string }) {
  const { data, loading } = useAsync(async () => {
    const [a, breeding, health, milk, cowMilk] = await Promise.all([api.getAnimal(id), api.listBreeding(), api.listHealth(), api.listMilk(), api.listCowMilk()]);
    return { a, breeding: breeding.filter(b => b.animalId === id), health: health.filter(h => h.animalIds.includes(id)), milk, cowMilk };
  });
  const [tab, setTab] = useState('overview');
  const [bOpen, setBOpen] = useState(false);
  const [bForm, setBForm] = useState<any>({ type: 'heat', date: todayISO(), sire: '', method: '', result: '', expectedCalving: '' });
  const { user } = useSession();

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const a = data.a;
  if (!a) return <EmptyState title="Animal not found" body="This animal may have been deleted." />;

  const myCow = data.cowMilk.filter(c => c.animalId === id).slice(-30);
  const total30 = myCow.reduce((s, c) => s + c.litres, 0);

  const addBreeding = async () => {
    await api.saveBreeding({ ...bForm, animalId: id, notes: '', calfTag: '', calfSex: '', calfOutcome: '' });
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Livestock', record: a.tag + ' breeding', oldValue: '', newValue: bForm.type, at: new Date().toISOString() });
    setBOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-5">
        <span
          className="w-14 h-14 rounded-panel inline-flex items-center justify-center shrink-0 text-cream font-bold text-lg border border-sand"
          style={{ background: a.photoColor }}
          aria-hidden="true"
        >
          {a.tag.slice(3)}
        </span>
        <div className="min-w-0">
          <h1 className="page-title">{a.tag} — {a.name}</h1>
          <p className="page-sub flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{a.breed}</span>
            <span aria-hidden="true">·</span>
            <span>{a.sex === 'F' ? 'Female' : 'Male'}</span>
            <span aria-hidden="true">·</span>
            <span>{ageYears(a.dob)}</span>
            <Badge tone={a.status === 'active' ? 'success' : 'info'}>{a.status}</Badge>
          </p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-sand overflow-x-auto" role="tablist">
        {['overview', 'milk', 'breeding', 'health', 'history'].map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-[44px] px-4 capitalize text-[15px] font-medium border-b-2 ${tab === t ? 'border-forest text-forest' : 'border-transparent text-ink-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="panel p-4 grid md:grid-cols-2 gap-4 text-[15px]">
          <div><div className="text-ink-muted text-[13px]">Date of birth</div><div>{fmtDate(a.dob)}</div></div>
          <div><div className="text-ink-muted text-[13px]">Group</div><div className="capitalize">{a.group}</div></div>
          <div><div className="text-ink-muted text-[13px]">Mother</div><div>{a.motherTag || '—'}</div></div>
          <div><div className="text-ink-muted text-[13px]">Father / sire</div><div>{a.fatherTag || '—'}</div></div>
          <div><div className="text-ink-muted text-[13px]">Source</div><div>{a.source === 'born' ? 'Born on farm' : `Purchased, ${fmtKES(a.purchasePrice || 0)}`}</div></div>
          <div><div className="text-ink-muted text-[13px]">Last 30-day yield</div><div className="num">{total30.toFixed(1)} L</div></div>
          <div className="md:col-span-2"><div className="text-ink-muted text-[13px]">Notes</div><div>{a.notes || 'No notes.'}</div></div>
          <div className="md:col-span-2 text-[13px] text-ink-muted">Last edited by {a.updatedBy}, {fmtDate(a.updatedAt)}</div>
        </div>
      )}
      {tab === 'milk' && (
        <div className="panel p-4">
          <h2 className="text-[17px] font-semibold mb-3">Last 30 days</h2>
          {myCow.length === 0 ? <p className="text-[15px] text-ink-muted">No milk records for this animal yet.</p> : (
            <table className="table-base"><thead><tr><th>Date</th><th>Litres</th></tr></thead>
            <tbody>{myCow.map(c => { const m = data.milk.find(x => x.id === c.milkId); return <tr key={c.id}><td>{m ? fmtDate(m.date) + ' (' + m.session + ')' : '—'}</td><td className="p-2 num">{c.litres.toFixed(1)} L</td></tr>; })}</tbody></table>
          )}
        </div>
      )}
      {tab === 'breeding' && (
        <div className="space-y-3">
          <Button onClick={() => setBOpen(true)}>Add breeding event</Button>
          {data.breeding.map(b => (
            <div key={b.id} className="panel p-4 text-[15px] flex flex-wrap gap-3">
              <Badge tone="info">{b.type}</Badge><span>{fmtDate(b.date)}</span>
              {b.sire && <span>Sire: {b.sire}</span>}{b.method && <span>Method: {b.method}</span>}
              {b.result && <span>Result: {b.result}</span>}{b.expectedCalving && <span>Expected calving: {fmtDate(b.expectedCalving)}</span>}
              {b.calfTag && <span>Calf: {b.calfTag} ({b.calfSex})</span>}
            </div>
          ))}
        </div>
      )}
      {tab === 'health' && (
        <div className="panel p-4">
          {data.health.length === 0 ? <p className="text-[15px] text-ink-muted">No health records for this animal.</p> : (
            <ul className="divide-y divide-sand">{data.health.map(h => <li key={h.id} className="py-2 text-[15px] flex flex-wrap gap-2"><Badge tone="neutral">{h.type}</Badge><span>{h.product}</span><span className="text-ink-muted">{fmtDate(h.date)}</span>{h.withdrawalEnd && <Badge tone="warning">Withdrawal to {fmtDate(h.withdrawalEnd)}</Badge>}</li>)}</ul>
          )}
        </div>
      )}
      {tab === 'history' && (
        <div className="panel p-4 text-[15px]">
          <p>Last edited by {a.updatedBy}, {fmtDate(a.updatedAt)}</p>
          <p className="text-ink-muted mt-1">Full audit history for this animal is in the Audit log.</p>
        </div>
      )}

      <Dialog open={bOpen} onClose={() => setBOpen(false)} title="Add breeding event">
        <div className="space-y-4">
          <Select label="Event type" value={bForm.type} onChange={(e) => setBForm({ ...bForm, type: e.target.value })} options={[{ value: 'heat', label: 'Heat' }, { value: 'insemination', label: 'Insemination / service' }, { value: 'pregnancy', label: 'Pregnancy check' }, { value: 'calving', label: 'Calving' }]} />
          <Input label="Date" type="date" value={bForm.date} onChange={(e) => setBForm({ ...bForm, date: e.target.value })} />
          <Input label="Sire" value={bForm.sire} onChange={(e) => setBForm({ ...bForm, sire: e.target.value })} />
          <Input label="Method" value={bForm.method} onChange={(e) => setBForm({ ...bForm, method: e.target.value })} placeholder="AI, natural service, rectal palpation" />
          <Input label="Result" value={bForm.result} onChange={(e) => setBForm({ ...bForm, result: e.target.value })} placeholder="Positive, negative" />
          <Input label="Expected calving date" type="date" value={bForm.expectedCalving} onChange={(e) => setBForm({ ...bForm, expectedCalving: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setBOpen(false)}>Cancel</Button><Button onClick={addBreeding}>Save event</Button></div>
        </div>
      </Dialog>
    </div>
  );
}
