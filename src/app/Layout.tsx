import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Beef, Milk, ShoppingCart, Users, Wallet, HeartPulse, HardHat,
  BarChart3, Bell, ScrollText, Settings, Search, Menu, X, LogOut, HelpCircle,
  ChevronsLeft, ChevronsRight, WifiOff, CircleUser
} from 'lucide-react';
import { LogoWithText } from '../assets/brand/Logo';
import { useSession } from '../lib/store';
import { useAsync, Badge, Dialog, Button } from '../components/ui';
import { api } from '../api';
import { en } from '../i18n/en';

const NAV = [
  { to: '/', label: en.nav.dashboard, icon: LayoutDashboard, module: 'dashboard', group: 'main' },
  { to: '/milk', label: en.nav.milk, icon: Milk, module: 'milk', group: 'main' },
  { to: '/sales', label: en.nav.sales, icon: ShoppingCart, module: 'sales', group: 'main' },
  { to: '/customers', label: en.nav.customers, icon: Users, module: 'customers', group: 'main' },
  { to: '/livestock', label: en.nav.livestock, icon: Beef, module: 'livestock', group: 'farm' },
  { to: '/health', label: en.nav.health, icon: HeartPulse, module: 'health', group: 'farm' },
  { to: '/labour', label: en.nav.labour, icon: HardHat, module: 'labour', group: 'farm' },
  { to: '/expenses', label: en.nav.expenses, icon: Wallet, module: 'expenses', group: 'farm' },
  { to: '/reports', label: en.nav.reports, icon: BarChart3, module: 'reports', group: 'admin' },
  { to: '/notifications', label: en.nav.notifications, icon: Bell, module: 'notifications', group: 'admin' },
  { to: '/audit', label: en.nav.audit, icon: ScrollText, module: 'audit', group: 'admin' },
  { to: '/settings', label: en.nav.settings, icon: Settings, module: 'settings', group: 'admin' }
];

const GROUPS: { id: string; label: string }[] = [
  { id: 'main', label: 'Daily work' },
  { id: 'farm', label: 'Farm' },
  { id: 'admin', label: 'Manage' }
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
  const { user, setUser, simulateOffline, sidebarCollapsed, toggleSidebar } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ label: string; to: string; kind: string }[]>([]);
  const navigate = useNavigate();
  const { data: notifs } = useAsync(() => api.listNotifications());
  const unread = (notifs || []).filter(n => !n.read).length;
  const isOnline = !simulateOffline;

  const doSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const [animals, customers, employees] = await Promise.all([
      api.listAnimals(), api.listCustomers(), api.listEmployees()
    ]);
    const res: { label: string; to: string; kind: string }[] = [];
    animals
      .filter(a => a.tag.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .forEach(a => res.push({ label: `${a.tag} — ${a.name}`, to: `/livestock/${a.id}`, kind: 'Animal' }));
    customers
      .filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 3)
      .forEach(c => res.push({ label: c.name, to: `/customers/${c.id}`, kind: 'Customer' }));
    employees
      .filter(e => e.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 3)
      .forEach(e => res.push({ label: e.name, to: '/labour', kind: 'Employee' }));
    setSearchResults(res);
  };

  const signOut = () => { setUser(null); navigate('/sign-in'); };

  const visibleNav = NAV.filter(n => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (n.module === 'settings') return false;
    if (n.module === 'audit') return user.role === 'manager';
    return true;
  });

  const sidebarBody = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      <div className={`border-b border-cream/15 ${collapsed ? 'px-2 py-4 flex justify-center' : 'px-4 py-4'}`}>
        <LogoWithText dark compact={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main">
        {GROUPS.map(g => {
          const items = visibleNav.filter(n => n.group === g.id);
          if (items.length === 0) return null;
          return (
            <div key={g.id} className="mb-1">
              {!collapsed && (
                <div className="px-4 pt-3 pb-1 text-[13px] font-medium text-cream/60">{g.label}</div>
              )}
              {items.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  title={collapsed ? n.label : undefined}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 mx-2 px-3 min-h-[42px] rounded-input text-[15px]
                     transition-colors duration-150 ${
                       isActive
                         ? 'bg-cream text-forest font-semibold'
                         : 'text-cream/90 hover:bg-forest-dark/70 hover:text-cream'
                     } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <n.icon size={19} className="shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                  {!collapsed && n.module === 'notifications' && unread > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                      rounded-full bg-gold-tint text-gold-dark text-[13px] font-semibold num">
                      {unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="p-2 border-t border-cream/15">
        <button
          onClick={toggleSidebar}
          className={`w-full min-h-[44px] text-cream/90 hover:bg-forest-dark/70 hover:text-cream rounded-input
            flex items-center gap-3 px-3 text-[15px] transition-colors duration-150 ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={19} /> : <><ChevronsLeft size={19} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="no-print sticky top-0 z-40 bg-cream border-b border-sand">
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-16 max-w-[1440px] mx-auto w-full">
          <button
            className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-input hover:bg-cream-deep"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="md:hidden"><LogoWithText compact /></div>

          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Search animals, customers, employees"
              aria-label="Search animals, customers, employees"
              className="w-full min-h-[40px] pl-9 pr-3 rounded-input border border-sand bg-paper text-[15px]
                placeholder:text-ink-muted/70 focus:border-forest transition-colors duration-150"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 panel z-50 overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 min-h-[44px] hover:bg-cream-deep text-[15px] flex items-center gap-2 border-b border-sand last:border-b-0"
                    onClick={() => { navigate(r.to); setSearchResults([]); setSearch(''); }}
                  >
                    <span className="flex-1 truncate">{r.label}</span>
                    <span className="text-[13px] text-ink-muted shrink-0">{r.kind}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 md:hidden" />

          <div className="hidden sm:block">
            <Badge tone={isOnline ? 'success' : 'warning'}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-forest' : 'bg-warning'}`} aria-hidden="true" />
              {isOnline ? en.common.online : 'Offline'}
            </Badge>
          </div>
          <div className="sm:hidden">
            <span className={`inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-full border
              ${isOnline ? 'bg-forest-tint border-forest/25 text-forest' : 'bg-warning-tint border-warning/25 text-warning'}`}
              aria-label={isOnline ? en.common.online : 'Offline'}
              title={isOnline ? en.common.online : 'Offline'}>
              {isOnline ? <span className="w-2 h-2 rounded-full bg-forest" /> : <WifiOff size={16} />}
            </span>
          </div>

          <button
            className="relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-input text-ink-muted hover:text-ink hover:bg-cream-deep transition-colors duration-150"
            onClick={() => navigate('/notifications')}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          >
            <Bell size={21} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-danger text-white text-[11px] rounded-full min-w-[18px] h-[18px]
                inline-flex items-center justify-center px-1 num font-semibold border-2 border-cream">
                {unread}
              </span>
            )}
          </button>
          <button
            className="hidden sm:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-input text-ink-muted hover:text-ink hover:bg-cream-deep transition-colors duration-150"
            onClick={() => setHelpOpen(true)}
            aria-label="Help"
          >
            <HelpCircle size={21} />
          </button>

          <div className="relative">
            <button
              className="min-h-[40px] pl-1.5 pr-2 md:pr-3 rounded-input border border-sand bg-paper hover:bg-cream-deep
                inline-flex items-center gap-2 text-[15px] font-semibold text-ink transition-colors duration-150"
              onClick={() => setUserMenu(!userMenu)}
              aria-haspopup="menu"
              aria-expanded={userMenu}
            >
              <span className="w-7 h-7 rounded-full bg-forest text-cream inline-flex items-center justify-center text-[13px] font-bold">
                {user?.name?.[0] ?? 'U'}
              </span>
              <span className="hidden md:inline">{user?.name.split(' ')[0]}</span>
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 mt-2 panel w-64 z-50 p-2" role="menu">
                  <div className="px-3 py-2.5 flex items-center gap-3 border-b border-sand mb-1">
                    <CircleUser size={28} className="text-ink-muted shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[15px] truncate">{user?.name}</div>
                      <div className="text-ink-muted text-[13px] capitalize">{user?.role}</div>
                    </div>
                  </div>
                  <button
                    className="w-full text-left px-3 min-h-[44px] hover:bg-cream-deep rounded-input text-[15px]"
                    role="menuitem"
                    onClick={() => { navigate('/settings'); setUserMenu(false); }}
                  >
                    {en.auth.switchRole} <span className="text-ink-muted">({en.auth.demoOnly})</span>
                  </button>
                  <button
                    className="w-full text-left px-3 min-h-[44px] hover:bg-cream-deep rounded-input text-[15px] flex items-center gap-2"
                    role="menuitem"
                    onClick={signOut}
                  >
                    <LogOut size={16} aria-hidden="true" /> {en.auth.signOut}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Desktop sidebar */}
        <aside
          className={`no-print hidden md:block bg-forest shrink-0 sticky top-16 h-[calc(100vh-4rem)] transition-[width] duration-150
            ${sidebarCollapsed ? 'w-[76px]' : 'w-64'}`}
          aria-label="Sidebar"
        >
          {sidebarBody(sidebarCollapsed)}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-forest flex flex-col">
              <div className="flex justify-end p-2">
                <button
                  className="min-w-[44px] min-h-[44px] text-cream inline-flex items-center justify-center rounded-input hover:bg-forest-dark"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              {sidebarBody(false)}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 px-3 md:px-6 py-4 md:py-6 pb-28 md:pb-8">
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
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[13px] transition-colors duration-150 ${
                  isActive ? 'text-forest font-semibold' : 'text-ink-muted'
                }`
              }
            >
              <t.icon size={21} aria-hidden="true" /><span>{t.label}</span>
            </NavLink>
          ))}
          <button
            className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[13px] text-ink-muted"
            onClick={() => setMoreOpen(true)}
          >
            <Menu size={21} aria-hidden="true" /><span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-cream overflow-y-auto">
          <div className="flex items-center justify-between px-4 h-16 border-b border-sand bg-paper sticky top-0">
            <span className="text-[17px] font-bold text-ink">All modules</span>
            <button
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-input hover:bg-cream-deep"
              onClick={() => setMoreOpen(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div className="p-3 space-y-4">
            {GROUPS.map(g => {
              const items = visibleNav.filter(n => n.group === g.id);
              if (items.length === 0) return null;
              return (
                <div key={g.id}>
                  <div className="px-1 pb-1.5 text-[13px] font-medium text-ink-muted">{g.label}</div>
                  <div className="panel overflow-hidden">
                    {items.map(n => (
                      <NavLink
                        key={n.to}
                        to={n.to}
                        end={n.to === '/'}
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 min-h-[52px] text-[15px] border-b border-sand last:border-b-0 ${
                            isActive ? 'bg-forest-tint text-forest font-semibold' : 'text-ink'
                          }`
                        }
                      >
                        <n.icon size={19} aria-hidden="true" /> {n.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
            <Button variant="secondary" className="w-full" onClick={() => { setMoreOpen(false); setHelpOpen(true); }}>
              <HelpCircle size={17} /> Help
            </Button>
          </div>
        </div>
      )}

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="How do I?" description="Short guides for common tasks.">
        <div className="space-y-0">
          {GUIDES.map((g, i) => (
            <div key={g.title} className={`py-3 ${i > 0 ? 'border-t border-sand' : ''}`}>
              <div className="font-semibold text-[15px] text-ink">{g.title}</div>
              <p className="text-[15px] text-ink-muted mt-0.5">{g.body}</p>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
