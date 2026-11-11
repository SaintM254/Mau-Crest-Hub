import { useState } from 'react';
import { useAsync, Button, Input, Select, Dialog, Badge, Tabs, EmptyState, Alert, PageHeader } from '../../components/ui';
import { api } from '../../api';
import { fmtKES, fmtDate, todayISO, sum } from '../../lib/utils';
import { useSession } from '../../lib/store';
import { exportExcel, printArea } from '../../lib/export';

export function LabourPage() {
  const { user, pushToast } = useSession();
  const { data, loading, reload } = useAsync(async () => {
    const [employees, attendance, tasks, leave, payroll] = await Promise.all([
      api.listEmployees(), api.listAttendance(), api.listTasks(), api.listLeave(), api.listPayroll()
    ]);
    return { employees, attendance, tasks, leave, payroll };
  });
  const [tab, setTab] = useState('employees');
  const [date, setDate] = useState(todayISO());
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ title: '', type: 'Milking', employeeId: '', date: todayISO() });
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [selectedRun, setSelectedRun] = useState<any>(null);

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;
  const isEntry = user?.role === 'entry';

  const markAll = async () => {
    const rows = Object.entries(marks).map(([employeeId, status]) => ({ employeeId, date, status }));
    if (!rows.length) return;
    await api.saveAttendance(rows);
    await api.addAudit({ user: user?.name, action: 'Created', module: 'Labour', record: 'Attendance ' + date, oldValue: '', newValue: `${rows.length} employees`, at: new Date().toISOString() });
    pushToast('Attendance saved');
    reload();
  };

  const approvePayroll = async (run: any) => {
    await api.savePayroll({ ...run, status: 'approved' });
    const total = sum(run.lines.map((l: any) => l.net));
    await api.saveExpense({ date: todayISO(), category: 'Wages', supplier: 'Payroll ' + run.month, amount: total, paymentMethod: 'bank', linkedAnimal: '', payrollRunId: run.id, note: '', createdBy: user?.name, updatedBy: user?.name, updatedAt: new Date().toISOString() });
    pushToast('Payroll approved and added to expenses');
    reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Labour" subtitle="Employees, attendance, tasks, leave and payroll." />
      <Tabs tabs={[{ id: 'employees', label: 'Employees' }, { id: 'attendance', label: 'Attendance' }, { id: 'tasks', label: 'Tasks' }, { id: 'leave', label: 'Leave' }, { id: 'payroll', label: 'Payroll' }]} active={tab} onChange={setTab} />

      {tab === 'employees' && (
        <div className="panel overflow-x-auto">
          <table className="table-base min-w-[720px]">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>ID number</th>{!isEntry && <th>Salary</th>}<th>Start date</th><th>Status</th></tr></thead>
            <tbody>
              {data.employees.map(e => (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td><td>{e.role}</td><td className="num">{e.phone}</td><td className="num">{e.nationalId}</td>
                  {!isEntry && <td className="num">{fmtKES(e.salary)}</td>}<td>{fmtDate(e.startDate)}</td>
                  <td><Badge tone={e.status === 'active' ? 'success' : 'neutral'}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-[17px] font-semibold mb-3">Mark today</h2>
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="mt-4 space-y-2">
              {data.employees.map(e => {
                const existing = data.attendance.find(a => a.employeeId === e.id && a.date === date);
                const val = marks[e.id] || existing?.status || 'present';
                return (
                  <div key={e.id} className="flex flex-wrap items-center gap-2 border-b border-sand pb-2">
                    <span className="w-48 text-[15px] font-medium">{e.name}</span>
                    {(['present', 'absent', 'leave', 'half'] as const).map(s => (
                      <button key={s} onClick={() => setMarks({ ...marks, [e.id]: s })} className={`min-h-[44px] px-3 rounded-input border capitalize text-[15px] ${val === s ? 'bg-forest text-cream border-forest' : 'bg-paper border-sand'}`}>{s}</button>
                    ))}
                  </div>
                );
              })}
            </div>
            <Button onClick={markAll} className="mt-4">Save attendance</Button>
          </div>
          <div className="panel p-4">
            <div className="flex items-center gap-3 mb-3"><h2 className="text-[17px] font-semibold">Month grid</h2><Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
            <div className="overflow-x-auto">
              <table className="text-[13px] min-w-[800px]">
                <thead><tr><th className="p-1 text-left">Employee</th>{Array.from({ length: 31 }, (_, i) => <th key={i} className="p-1 num">{i + 1}</th>)}</tr></thead>
                <tbody>
                  {data.employees.map(e => (
                    <tr key={e.id}>
                      <td className="p-1 whitespace-nowrap">{e.name.split(' ')[0]}</td>
                      {Array.from({ length: 31 }, (_, i) => {
                        const d = `${month}-${String(i + 1).padStart(2, '0')}`;
                        const a = data.attendance.find(x => x.employeeId === e.id && x.date === d);
                        const s = a?.status;
                        return <td key={i} className={`p-1 text-center num ${s === 'present' ? 'bg-forest-tint' : s === 'absent' ? 'bg-danger-tint' : s === 'leave' ? 'bg-warning-tint' : ''}`}>{s ? s[0].toUpperCase() : ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-3">
          <Button onClick={() => setTaskOpen(true)}>Assign task</Button>
          {data.tasks.length === 0 ? <EmptyState title="No tasks" body="Assign daily tasks here." /> : (
            <div className="panel overflow-x-auto">
              <table className="table-base min-w-[560px]">
                <thead><tr><th>Date</th><th>Task</th><th>Employee</th><th>Done</th></tr></thead>
                <tbody>
                  {[...data.tasks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map(t => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.date)}</td><td>{t.title} ({t.type})</td>
                      <td>{data.employees.find(e => e.id === t.employeeId)?.name || '—'}</td>
                      <td><button onClick={async () => { await api.saveTask({ ...t, done: !t.done }); reload(); }} className="min-h-[44px] px-3 rounded-input border border-sand">{t.done ? 'Done' : 'Mark done'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'leave' && (
        <div className="panel overflow-x-auto">
          <table className="table-base min-w-[560px]">
            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
            <tbody>{data.leave.map(l => <tr key={l.id}><td>{data.employees.find(e => e.id === l.employeeId)?.name}</td><td>{l.type}</td><td>{fmtDate(l.fromDate)}</td><td>{fmtDate(l.toDate)}</td><td className="num">{l.days}</td><td><Badge tone="success">{l.status}</Badge></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 'payroll' && (
        isEntry ? <Alert tone="danger">You do not have permission to view payroll. Payroll is visible to owners and managers only.</Alert> : (
          <div className="space-y-3">
            {data.payroll.map(run => (
              <div key={run.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-[17px]">{run.month}</span>
                  <Badge tone={run.status === 'approved' ? 'success' : 'warning'}>{run.status}</Badge>
                  <span className="num text-[15px]">Net total: {fmtKES(sum(run.lines.map(l => l.net)))}</span>
                  <div className="flex-1" />
                  <Button variant="secondary" onClick={() => setSelectedRun(run)}>Review</Button>
                  {run.status === 'draft' && <Button onClick={() => approvePayroll(run)}>Approve and add to expenses</Button>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Dialog open={taskOpen} onClose={() => setTaskOpen(false)} title="Assign task">
        <div className="space-y-4">
          <Input label="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <Select label="Type" value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })} options={['Milking', 'Feeding', 'Treatment', 'Cleaning', 'Delivery'].map(t => ({ value: t, label: t }))} />
          <Select label="Employee" value={taskForm.employeeId} onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })} options={[{ value: '', label: 'Choose' }, ...data.employees.map(e => ({ value: e.id, label: e.name }))]} />
          <Input label="Date" type="date" value={taskForm.date} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} />
          <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setTaskOpen(false)}>Cancel</Button><Button onClick={async () => { await api.saveTask({ ...taskForm, done: false, source: 'manual' }); setTaskOpen(false); pushToast('Task assigned'); reload(); }}>Assign task</Button></div>
        </div>
      </Dialog>

      <Dialog open={!!selectedRun} onClose={() => setSelectedRun(null)} title={`Payroll — ${selectedRun?.month || ''}`} wide>
        {selectedRun && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table-base min-w-[720px]">
                <thead><tr><th>Employee</th><th>Basic</th><th>Allowances</th><th>Advances</th><th>PAYE</th><th>NHIF</th><th>NSSF</th><th>Net</th></tr></thead>
                <tbody>
                  {selectedRun.lines.map((l: any) => (
                    <tr key={l.employeeId}>
                      <td>{data.employees.find(e => e.id === l.employeeId)?.name}</td>
                      <td className="p-2 num">{fmtKES(l.basic)}</td><td className="p-2 num">{fmtKES(l.allowances)}</td>
                      <td className="p-2 num">{fmtKES(l.advances)}</td><td className="p-2 num">{fmtKES(l.paye)}</td>
                      <td className="p-2 num">{fmtKES(l.nhif)}</td><td className="p-2 num">{fmtKES(l.nssf)}</td>
                      <td className="p-2 num font-bold">{fmtKES(l.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-ink-muted">Statutory rates are placeholders to be confirmed in Settings.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => printArea(`<h2>Payslip — ${selectedRun.month}</h2><p>Total net: ${fmtKES(sum(selectedRun.lines.map((l: any) => l.net)))}</p>`)}>Print payslips</Button>
              <Button variant="secondary" onClick={() => exportExcel('payroll-' + selectedRun.month, selectedRun.lines.map((l: any) => ({ Employee: data.employees.find(e => e.id === l.employeeId)?.name, Basic: l.basic, Net: l.net })))}>Export Excel</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
