import { useState } from 'react';
import { useAsync, Button, Dialog, SearchBar, Select, Alert, Pagination } from '../../components/ui';
import { api } from '../../api';
import { fmtDateTime } from '../../lib/utils';
import { useSession } from '../../lib/store';

export function AuditPage() {
  const { user } = useSession();
  const { data, loading } = useAsync(() => api.listAudit());
  const [q, setQ] = useState('');
  const [module, setModule] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  if (user?.role === 'entry') return <Alert tone="danger">You do not have permission to view the audit log.</Alert>;

  const modules = [...new Set(data.map(a => a.module))];
  const filtered = data.filter(a => (module === 'all' || a.module === module) && (a.user.toLowerCase().includes(q.toLowerCase()) || a.record.toLowerCase().includes(q.toLowerCase())));
  const sorted = [...filtered].sort((a, b) => b.at.localeCompare(a.at));
  const pageRows = sorted.slice((page - 1) * 20, page * 20);

  return (
    <div className="space-y-4">
      <h1 className="text-[24px] font-bold">Audit log</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Search user or record" />
        <Select value={module} onChange={(e) => setModule(e.target.value)} options={[{ value: 'all', label: 'All modules' }, ...modules.map(m => ({ value: m, label: m }))]} />
      </div>
      <div className="bg-paper border border-sand rounded-panel overflow-x-auto">
        <table className="w-full text-[15px] min-w-[720px]">
          <thead><tr className="bg-cream-deep text-left"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Module</th><th className="p-3">Record</th><th className="p-3">Details</th></tr></thead>
          <tbody>
            {pageRows.map(a => (
              <tr key={a.id} className="border-t border-sand">
                <td className="p-3 num whitespace-nowrap">{fmtDateTime(a.at)}</td><td className="p-3">{a.user}</td>
                <td className="p-3">{a.action}</td><td className="p-3">{a.module}</td><td className="p-3">{a.record}</td>
                <td className="p-3"><button className="text-forest font-semibold min-h-[44px] px-2" onClick={() => setSelected(a)}>View change</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={sorted.length} onPage={setPage} />
      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Change details">
        {selected && (
          <div className="space-y-3 text-[15px]">
            <div><div className="text-ink-muted text-[13px]">User</div><div>{selected.user}</div></div>
            <div><div className="text-ink-muted text-[13px]">Action</div><div>{selected.action} — {selected.module}</div></div>
            <div><div className="text-ink-muted text-[13px]">Record</div><div>{selected.record}</div></div>
            <div><div className="text-ink-muted text-[13px]">Before</div><div className="bg-cream-deep rounded-input p-3">{selected.oldValue || '—'}</div></div>
            <div><div className="text-ink-muted text-[13px]">After</div><div className="bg-forest-tint rounded-input p-3">{selected.newValue || '—'}</div></div>
            <div><div className="text-ink-muted text-[13px]">When</div><div>{fmtDateTime(selected.at)}</div></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
