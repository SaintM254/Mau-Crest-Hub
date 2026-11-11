import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Beef, Milk, ShoppingCart, Users, Wallet, HeartPulse, HardHat, BarChart3, Bell, ScrollText, Settings, Search, Menu, X, LogOut, HelpCircle } from 'lucide-react';
import { LogoWithText } from '../assets/brand/Logo';
import { useSession } from '../lib/store';
import { useAsync, Badge, Dialog, Button } from '../components/ui';
import { api } from '../api';
import { en } from '../i18n/en';

const NAV = [
  { to: '/', label: en.nav.dashboard, icon: LayoutDashboard, module: 'dashboard' },
  { to: '/livestock', label: en.nav.livestock, icon: Beef, module: 'livestock' },
  { to: '/milk', label: en.nav.milk, icon: Milk, module: 'milk' },
  { to: '/sales', label: en.nav.sales, icon: ShoppingCart, module: 'sales' },
  { to: '/customers', label: en.nav.customers, icon: Users, module: 'customers' },
  { to: '/expenses', label: en.nav.expenses, icon: Wallet, module: 'expenses' },
  { to: '/health', label: en.nav.health, icon: HeartPulse, module: 'health' },
  { to: '/labour', label: en.nav.labour, icon: HardHat, module: 'labour' },
  { to: '/reports', label: en.nav.reports, icon: BarChart3, module: 'reports' },
  { to: '/notifications', label: en.nav.notifications, icon: Bell, module: 'notifications' },
  { to: '/audit', label: en.nav.audit, icon: ScrollText, module: 'audit' },
  { to: '/settings', label: en.nav.settings, icon: Settings, module: 'settings' }
];

const GUIDES = [
  { title: 'Record milk', body: 'Go to Milk, choose the date and session, enter litres per cow, then tap Save milk record.' },
  { title: 'Make a sale', body: 'Go to Sales, choose the customer, enter litres, pick the payment method and tap Record sale.' },
  { title: 'Add an animal', body: 'Go to Livestock, tap Add animal, fill in the tag, name and breed, then Save animal.' },
  { title: 'Record a vaccination', body: 'Go to Health, tap Add health record, choose Vaccination, pick the animals and Save health record.' },
  { title: 'Mark attendance', body: 'Go to Labour, open Attendance, choose today and tap Present or Absent for each employee.' },
  { title: 'Export a report', body: 'Go to Reports, pick a report and date range, then tap Export to Excel or Export to PDF.' }
];

export function Layout() {
  const { user, setUser, online, simulateOffline, sidebarCollapsed, toggleSidebar } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ label: string; to: string }[]>([]);
  const navigate = useNavigate();
  const { data: notifs } = useAsync(() => api.listNotifications());
  const unread = (notifs || []).filter(n => !n.read).length;
  const isOnline = online && !simulateOffline;

  const doSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const [animals, customers, employees] = await Promise.all([api.listAnimals(), api.listCustomers(), api.listEmployees()]);
    const res: { label: string; to: string }[] = [];
    animals.filter(a => a.tag.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
      .forEach(a => res.push({ label: `${a.tag} — ${a.name}`, to: `/livestock/${a.id}` }));
    customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3)
      .forEach(c => res.push({ label: c.name, to: `/customers/${c.id}` }));
    employees.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3)
      .forEach(e => res.push({ label: e.name + ' (employee)', to: '/labour' }));
    setSearchResults(res);
  };

  const signOut = () => { setUser(null); navigate('/sign-in'); };

  const visibleNav = NAV.filter(n => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (n.module === 'audit' || n.module === 'settings') return user.role === 'manager' && n.module === 'audit';
    return true;
  });

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-cream/20">
        <LogoWithText dark />
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main">
        {visibleNav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => `flex items-center gap-3 px-4 min-h-[44px] text-[15px] ${isActive ? 'bg-forest-dark text-cream font-semibold' : 'text-cream/85 hover:bg-forest-dark/60'}`}>
            <n.icon size={20} />
            {!sidebarCollapsed && <span>{n.label}</span>}
            {n.module === 'notifications' && unread > 0 && !sidebarCollapsed && <Badge tone="gold">{unread}</Badge>}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-cream/20">
        <button onClick={toggleSidebar} className="w-full min-h-[44px] text-cream/85 hover:bg-forest-dark/60 rounded-input flex items-center gap-3 px-2">
          <Menu size={20} /> {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="no-print sticky top-0 z-40 bg-cream border-b border-sand">
        <div className="flex items-center gap-3 px-4 py-2 max-w-[1440px] mx-auto w-full">
          <button className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="md:hidden"><LogoWithText /></div>
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Search animals, customers, employees"
              className="w-full min-h-[44px] pl-10 pr-3 rounded-input border border-sand bg-paper text-[15px]" />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-paper border border-sand rounded-panel shadow-none z-50">
                {searchResults.map((r, i) => (
                  <button key={i} className="w-full text-left px-3 py-2 min-h-[44px] hover:bg-cream-deep text-[15px]" onClick={() => { navigate(r.to); setSearchResults([]); setSearch(''); }}>{r.label}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 md:hidden" />
          <Badge tone={isOnline ? 'success' : 'warning'}>{isOnline ? en.common.online : en.common.offline}</Badge>
          <button className="relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center" onClick={() => navigate('/notifications')} aria-label="Notifications">
            <Bell size={22} />
            {unread > 0 && <span className="absolute top-1 right-1 bg-danger text-white text-xs rounded-full min-w-[20px] h-5 inline-flex items-center justify-center px-1 num">{unread}</span>}
          </button>
          <button className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center" onClick={() => setHelpOpen(true)} aria-label="Help"><HelpCircle size={22} /></button>
          <div className="relative">
            <button className="min-h-[44px] px-3 rounded-input bg-forest text-cream font-semibold text-[15px]" onClick={() => setUserMenu(!userMenu)}>
              {user?.name.split(' ')[0]}
            </button>
            {userMenu && (
              <div className="absolute right-0 mt-1 bg-paper border border-sand rounded-panel w-64 z-50 p-2">
                <div className="px-3 py-2 text-[15px]"><div className="font-semibold">{user?.name}</div><div className="text-ink-muted text-[13px] capitalize">{user?.role}</div></div>
                <button className="w-full text-left px-3 py-2 min-h-[44px] hover:bg-cream-deep rounded-input text-[15px]" onClick={() => { navigate('/settings'); setUserMenu(false); }}>{en.auth.switchRole} ({en.auth.demoOnly})</button>
                <button className="w-full text-left px-3 py-2 min-h-[44px] hover:bg-cream-deep rounded-input text-[15px] flex items-center gap-2" onClick={signOut}><LogOut size={16} /> {en.auth.signOut}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Desktop sidebar */}
        <aside className={`no-print hidden md:block bg-forest shrink-0 ${sidebarCollapsed ? 'w-[72px]' : 'w-60'}`} aria-label="Sidebar">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-forest">
              <div className="flex justify-end p-2"><button className="min-w-[44px] min-h-[44px] text-cream inline-flex items-center justify-center" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={22} /></button></div>
              {sidebar}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-sand z-40" aria-label="Mobile">
        <div className="grid grid-cols-5">
          {[
            { to: '/', label: 'Home', icon: LayoutDashboard },
            { to: '/milk', label: 'Milk', icon: Milk },
            { to: '/sales', label: 'Sales', icon: ShoppingCart },
            { to: '/livestock', label: 'Animals', icon: Beef }
          ].map(t => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center py-2 min-h-[56px] text-[13px] ${isActive ? 'text-forest font-semibold' : 'text-ink-muted'}`}>
              <t.icon size={22} /><span>{t.label}</span>
            </NavLink>
          ))}
          <button className="flex flex-col items-center py-2 min-h-[56px] text-[13px] text-ink-muted" onClick={() => setMoreOpen(true)}>
            <Menu size={22} /><span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-cream overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-sand">
            <span className="text-[17px] font-bold">All modules</span>
            <button className="min-w-[44px] min-h-[44px]" onClick={() => setMoreOpen(false)} aria-label="Close"><X size={22} /></button>
          </div>
          <div className="p-2">
            {visibleNav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 min-h-[52px] text-[15px] border-b border-sand">
                <n.icon size={20} /> {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="How do I?">
        <div className="space-y-4">
          {GUIDES.map(g => (
            <div key={g.title} className="border-b border-sand pb-3">
              <div className="font-semibold text-[15px]">{g.title}</div>
              <p className="text-[15px] text-ink-muted">{g.body}</p>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
