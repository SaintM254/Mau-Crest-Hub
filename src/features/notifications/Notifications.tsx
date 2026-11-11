import { useState } from 'react';
import { useAsync, Button, Badge, Tabs } from '../../components/ui';
import { api } from '../../api';
import { fmtDateTime } from '../../lib/utils';
import { useSession } from '../../lib/store';

export function NotificationsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [notifs, messages] = await Promise.all([api.listNotifications(), api.listMessages()]);
    return { notifs, messages };
  });
  const [tab, setTab] = useState('screen');
  const [filter, setFilter] = useState('all');
  const { pushToast } = useSession();

  if (loading || !data) return <div className="h-40 bg-cream-deep skeleton-pulse rounded-panel" />;

  const filtered = data.notifs.filter(n => filter === 'all' || n.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-bold">Notifications</h1>
        <div className="flex-1" />
        <Button variant="secondary" onClick={async () => { await api.markAllRead(); pushToast('All marked as read'); reload(); }}>Mark all read</Button>
      </div>
      <Tabs tabs={[{ id: 'screen', label: 'On screen' }, { id: 'log', label: 'Messages sent (SMS and email)' }]} active={tab} onChange={setTab} />
      {tab === 'screen' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['all', 'health', 'sales', 'system'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`min-h-[44px] px-4 rounded-full border capitalize text-[15px] ${filter === f ? 'bg-forest text-cream border-forest' : 'bg-paper border-sand'}`}>{f}</button>
            ))}
          </div>
          {filtered.map(n => (
            <div key={n.id} className={`bg-paper border border-sand rounded-panel p-4 flex gap-3 ${n.read ? 'opacity-70' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-semibold text-[15px]">{n.title}</span><Badge tone={n.category === 'health' ? 'warning' : n.category === 'sales' ? 'info' : 'neutral'}>{n.category}</Badge>{!n.read && <Badge tone="gold">Unread</Badge>}</div>
                <p className="text-[15px] text-ink-muted">{n.body}</p>
                <p className="text-[13px] text-ink-muted">{fmtDateTime(n.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'log' && (
        <div className="bg-paper border border-sand rounded-panel overflow-x-auto">
          <table className="w-full text-[15px] min-w-[640px]">
            <thead><tr className="bg-cream-deep text-left"><th className="p-3">Channel</th><th className="p-3">To</th><th className="p-3">Message</th><th className="p-3">Status</th><th className="p-3">When</th></tr></thead>
            <tbody>{data.messages.map(m => <tr key={m.id} className="border-t border-sand"><td className="p-3 uppercase">{m.channel}</td><td className="p-3 num">{m.to}</td><td className="p-3">{m.body}</td><td className="p-3"><Badge tone="success">{m.status}</Badge></td><td className="p-3">{fmtDateTime(m.at)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
