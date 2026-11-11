import { useState } from 'react';
import { useAsync, Button, Input, Select, Badge, Alert, Switch, Dialog, ConfirmDialog, Tabs, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtDate, fmtKES } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { resetData } from '../../data/seed';
import { can, CAPABILITY_LABELS, OWNER_ONLY, type Capability } from '../../lib/permissions';

/** Capabilities shown in the Settings role summary. Mirrors src/lib/permissions.ts. */
const ROLE_PREVIEW = {
  owner: [] as string[],
  manager: [
    'record.milk', 'record.sales', 'record.health', 'record.attendance', 'edit.any',
    'payroll.view', 'reports.view', 'reports.profit', 'expenses.record', 'audit.view'
  ],
  entry: ['record.milk', 'record.sales', 'record.health', 'record.attendance']
};

export function SettingsPage() {
  const { user, pushToast, simulateOffline, setSimulateOffline } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [settings, backups, users, perms] = await Promise.all([api.getSettings(), api.listBackups(), api.listUsers(), api.listPermissions()]);
    return { settings, backups, users, perms };
  });
  const [tab, setTab] = useState('farm');
  const [form, setForm] = useState<any>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [userForm, setUserForm] = useState<any>({ name: '', email: '', phone: '', role: 'entry', password: 'entry123' });

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  if (!can(user, 'settings.manage')) return <Alert tone="danger">You do not have permission to view Settings. Settings are for the owner only.</Alert>;

  const s = form || data.settings || {};
  const set = (k: string, v: any) => setForm({ ...s, [k]: v });

  const saveSettings = async () => {
    await api.saveSettings(s);
    pushToast('Settings saved');
    reload();
  };

  const togglePerm = (role: string, module: string, field: string) => {
    const perms = data.perms.map(p => {
      if (p.role === role && p.module === module) return { ...p, [field]: !(p as any)[field] };
      return p;
    });
    api.savePermissions(perms).then(reload);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Farm details, prices, integrations, users and backups." />
      <Tabs tabs={[{ id: 'farm', label: 'Farm and prices' }, { id: 'integrations', label: 'M-Pesa, SMS and reminders' }, { id: 'payroll', label: 'Payroll rates' }, { id: 'users', label: 'Users and permissions' }, { id: 'backup', label: 'Backups' }, { id: 'demo', label: 'Demo and role' }]} active={tab} onChange={setTab} />

      {tab === 'farm' && (
        <div className="panel p-4 space-y-4 max-w-2xl">
          <Input label="Farm name" value={s.farmName || ''} onChange={(e) => set('farmName', e.target.value)} />
          <Input label="Location" value={s.location || ''} onChange={(e) => set('location', e.target.value)} />
          <Input label="Farm phone" value={s.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Farm email" value={s.email || ''} onChange={(e) => set('email', e.target.value)} />
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="Price — individuals (KES/L)" type="number" value={s.priceIndividual || ''} onChange={(e) => set('priceIndividual', Number(e.target.value))} />
            <Input label="Price — shops (KES/L)" type="number" value={s.priceShop || ''} onChange={(e) => set('priceShop', Number(e.target.value))} />
            <Input label="Price — cooperatives (KES/L)" type="number" value={s.priceCoop || ''} onChange={(e) => set('priceCoop', Number(e.target.value))} />
          </div>
          <Input label="Milk reconciliation threshold (L)" type="number" value={s.reconThreshold || ''} onChange={(e) => set('reconThreshold', Number(e.target.value))} />
          <Button onClick={saveSettings}>Save settings</Button>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="panel p-4 space-y-4 max-w-2xl">
          <Input label="M-Pesa Till number" value={s.tillNumber || ''} onChange={(e) => set('tillNumber', e.target.value)} />
          <Input label="M-Pesa Paybill number" value={s.paybillNumber || ''} onChange={(e) => set('paybillNumber', e.target.value)} />
          <div><Badge tone="success">M-Pesa: Connected (mock)</Badge></div>
          <Input label="SMS sender name" value={s.smsSender || ''} onChange={(e) => set('smsSender', e.target.value)} />
          <Input label="Email sender" value={s.emailSender || ''} onChange={(e) => set('emailSender', e.target.value)} />
          <Input label="Reminder days before" type="number" value={s.reminderDays || ''} onChange={(e) => set('reminderDays', Number(e.target.value))} />
          <Button variant="secondary" onClick={async () => { await api.sendMessage({ channel: 'sms', to: '0712 345 678', body: 'Test message from Mau Crest Hub.' }); pushToast('Test message sent (mock)'); }}>Send test SMS</Button>
          <Button onClick={saveSettings}>Save settings</Button>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="panel p-4 space-y-4 max-w-2xl">
          <Alert tone="warning">Statutory rates are placeholders to be confirmed with your accountant.</Alert>
          <Input label="PAYE rate (%)" type="number" value={s.payeRate || ''} onChange={(e) => set('payeRate', Number(e.target.value))} />
          <Input label="NHIF rate (%)" type="number" value={s.nhifRate || ''} onChange={(e) => set('nhifRate', Number(e.target.value))} />
          <Input label="NSSF rate (%)" type="number" value={s.nssfRate || ''} onChange={(e) => set('nssfRate', Number(e.target.value))} />
          <Button onClick={saveSettings}>Save settings</Button>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3"><Button onClick={() => setUserOpen(true)}>Add user</Button></div>
          <div className="panel overflow-x-auto">
            <table className="table-base min-w-[640px]">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td><td>{u.email}</td><td className="capitalize">{u.role}</td>
                    <td><Badge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <button className="text-forest font-semibold min-h-[44px] px-2" onClick={async () => { await api.saveUser({ ...u, active: !u.active }); reload(); }}>{u.active ? 'Deactivate' : 'Activate'}</button>
                      <button className="text-forest font-semibold min-h-[44px] px-2" onClick={async () => { await api.saveUser({ ...u, password: 'reset123' }); pushToast('Password reset to reset123'); }}>Reset password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel p-4 md:p-5">
            <h2 className="text-[17px] font-semibold">What each role can do</h2>
            <p className="text-[13px] text-ink-muted mt-0.5 mb-4">
              Anyone who signs in sees only the work their role allows. The owner also holds everything the manager holds.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {(['owner', 'manager', 'entry'] as const).map(role => {
                const list = (Object.keys(CAPABILITY_LABELS) as Capability[]).filter(c => {
                  if (role === 'owner') return true;
                  return (ROLE_PREVIEW[role] as Capability[]).includes(c);
                });
                const count = list.length;
                return (
                  <div key={role} className="rounded-panel border border-sand p-3.5 bg-cream">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold capitalize text-[15px]">{role === 'entry' ? 'Data entry' : role}</span>
                      <Badge tone={role === 'owner' ? 'success' : 'neutral'}>{count} permissions</Badge>
                    </div>
                    <ul className="space-y-1.5">
                      {list.map(c => (
                        <li key={c} className="text-[13px] flex items-start gap-1.5">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${OWNER_ONLY.includes(c) ? 'bg-gold' : 'bg-forest'}`} aria-hidden="true" />
                          <span>{CAPABILITY_LABELS[c]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="text-[13px] text-ink-muted mt-3">
              Items marked in gold are owner only and cannot be granted to a manager or data entry user.
            </p>
          </div>

          <div className="panel p-4 overflow-x-auto">
            <h2 className="text-[17px] font-semibold mb-3">Permission matrix</h2>
            <table className="table-base min-w-[800px]">
              <thead><tr><th>Module</th>{['owner', 'manager', 'entry'].map(r => <th key={r} className="p-2 capitalize" colSpan={4}>{r}</th>)}</tr>
              <tr><th></th>{['owner', 'manager', 'entry'].map(r => <>{['View', 'Create', 'Edit', 'Delete'].map(a => <th key={r + a} className="p-2">{a}</th>)}</>)}</tr></thead>
              <tbody>
                {[...new Set(data.perms.map(p => p.module))].map(mod => (
                  <tr key={mod}>
                    <td className="p-2 capitalize">{mod}</td>
                    {['owner', 'manager', 'entry'].map(role => {
                      const p = data.perms.find(x => x.role === role && x.module === mod);
                      if (!p) return null;
                      return (['view', 'create', 'edit', 'del'] as const).map(f => (
                        <td key={role + f} className="p-2"><input type="checkbox" checked={(p as any)[f]} onChange={() => togglePerm(role, mod, f)} className="w-5 h-5 accent-[#1F4D2E]" aria-label={`${role} ${mod} ${f}`} /></td>
                      ));
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'backup' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={async () => { await api.backupNow(); pushToast('Backup complete'); reload(); }}>Back up now</Button>
            <Button variant="secondary" onClick={() => pushToast('Restore requested (mock)')}>Request restore</Button>
          </div>
          <div className="panel overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Date</th><th>Size</th><th>Status</th></tr></thead>
              <tbody>{[...data.backups].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(b => <tr key={b.id}><td>{fmtDate(b.date)}</td><td className="num">{b.size}</td><td><Badge tone={b.status === 'success' ? 'success' : b.status === 'failed' ? 'danger' : 'warning'}>{b.status}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'demo' && (
        <div className="panel p-4 space-y-4 max-w-2xl">
          <Switch label="Simulate offline mode" checked={simulateOffline} onChange={(e) => setSimulateOffline(e.target.checked)} />
          <p className="text-[15px] text-ink-muted">Turn this on to see the offline chip and sync behaviour. Changes are saved on this device.</p>
          <div className="border-t border-sand pt-4">
            <h2 className="text-[17px] font-semibold mb-2">Reset demo data</h2>
            <p className="text-[15px] text-ink-muted mb-3">This removes all changes and restores the original demo data.</p>
            <Button variant="danger" onClick={() => setResetOpen(true)}>Reset demo data</Button>
          </div>
          <div className="border-t border-sand pt-4 text-[15px] text-ink-muted">Mau Crest Hub version 1.0.0 (demo). All data is fictional.</div>
        </div>
      )}

      <Dialog open={userOpen} onClose={() => setUserOpen(false)} title="Add user">
        <div className="space-y-4">
          <Input label="Full name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          <Input label="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          <Input label="Phone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
          <Select label="Role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} options={[{ value: 'owner', label: 'Owner' }, { value: 'manager', label: 'Manager' }, { value: 'entry', label: 'Data entry' }]} />
          <Input label="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setUserOpen(false)}>Cancel</Button><Button onClick={async () => { await api.saveUser({ ...userForm, active: true }); setUserOpen(false); pushToast('User added'); reload(); }}>Add user</Button></div>
        </div>
      </Dialog>

      <ConfirmDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={async () => { await resetData(); setResetOpen(false); pushToast('Demo data reset'); reload(); }} title="Reset demo data" body="All changes will be removed and the original demo data restored. Continue?" confirmLabel="Reset demo data" />
    </div>
  );
}
