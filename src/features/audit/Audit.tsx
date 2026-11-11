import { useState } from 'react';
import { useAsync, Button, Dialog, SearchBar, Select, Alert, Pagination, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtDateTime } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { can } from '../../lib/permissions';

export function AuditPage() {
  const { user } = useSession();
  const { data, loading } = useAsync(() => api.listAudit());
  const [q, setQ] = useState('');
  const [module, setModule] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  if (!can(user, 'audit.view')) return <Alert tone="danger">You do not have permission to view the audit log.</Alert>;

  const modules = [...new Set(data.map(a => a.module))];
  const filtered = data.filter(a => (module === 'all' || a.module === module) && (a.user.toLowerCase().includes(q.toLowerCase()) || a.record.toLowerCase().includes(q.toLowerCase())));
  const sorted = [...filtered].sort((a, b) => b.at.localeCompare(a.at));
  const pageRows = sorted.slice((page - 1) * 20, page * 20);

  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" subtitle="Every change made in the system, with who made it and when." />
      <div className="grid md:grid-cols-2 gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Search user or record" />
        <Select value={module} onChange={(e) => setModule(e.target.value)} options={[{ value: 'all', label: 'All modules' }, ...modules.map(m => ({ value: m, label: m }))]} />
      </div>
      <div className="panel overflow-x-auto">
        <table className="table-base min-w-[720px]">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Module</th><th>Record</th><th>Details</th></tr></thead>
          <tbody>
            {pageRows.map(a => (
              <tr key={a.id}>
                <td className="num whitespace-nowrap">{fmtDateTime(a.at)}</td><td>{a.user}</td>
                <td>{a.action}</td><td>{a.module}</td><td>{a.record}</td>
                <td><button className="text-forest font-semibold min-h-[44px] px-2" onClick={() => setSelected(a)}>View change</button></td>
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
