import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { SignIn } from '../features/auth/SignIn';
import { Dashboard } from '../features/dashboard/Dashboard';
import { LivestockList, AnimalProfileInner } from '../features/livestock/Livestock';
import { MilkPage } from '../features/milk/Milk';
import { SalesPage } from '../features/sales/Sales';
import { CustomersList, CustomerProfile, CreditAgeing } from '../features/customers/Customers';
import { ExpensesPage } from '../features/expenses/Expenses';
import { HealthPage } from '../features/health/Health';
import { LabourPage } from '../features/labour/Labour';
import { ReportsPage } from '../features/reports/Reports';
import { NotificationsPage } from '../features/notifications/Notifications';
import { AuditPage } from '../features/audit/Audit';
import { SettingsPage } from '../features/settings/Settings';
import { DesignSystem } from '../features/design/DesignSystem';
import { Toasts, Alert } from '../components/ui';
import { useSession } from '../lib/store';
import { seedIfEmpty } from '../data/seed';
import { api } from '../api';

function AnimalRoute() {
  const { id } = useParams();
  return <AnimalProfileInner id={id || ''} />;
}

function CustomerRoute() {
  const { id } = useParams();
  return <CustomerProfile id={id || ''} />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function RoleSwitch() {
  const { user, setUser } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api.listUsers().then(setUsers); }, []);
  if (!user) return null;
  const switchTo = (u: any) => { setUser(u); window.location.hash = '#/'; window.location.reload(); };
  return (
    <div className="panel p-4">
      <h2 className="text-[17px] font-semibold mb-2">Switch demo role</h2>
      <p className="text-[13px] text-ink-muted mb-3">Demo only. Switch to see each role's experience.</p>
      <div className="flex flex-wrap gap-2">
        {users.map(u => (
          <button key={u.id} onClick={() => switchTo(u)} className={`min-h-[44px] px-4 rounded-input border text-[15px] ${user.id === u.id ? 'bg-forest text-cream border-forest' : 'bg-paper border-sand'}`}>
            {u.name} ({u.role})
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { seedIfEmpty().then(() => setReady(true)); }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-3">
          <div className="h-8 bg-cream-deep skeleton-pulse rounded-input w-56" />
          <div className="h-24 bg-cream-deep skeleton-pulse rounded-panel" />
          <p className="text-[15px] text-ink-muted">Preparing demo data...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Toasts />
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="livestock" element={<LivestockList />} />
          <Route path="livestock/:id" element={<AnimalRoute />} />
          <Route path="milk" element={<MilkPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="customers" element={<><CustomersList /><div className="mt-4"><CreditAgeing /></div></>} />
          <Route path="customers/:id" element={<CustomerRoute />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="labour" element={<LabourPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<><SettingsPage /><div className="mt-4"><RoleSwitch /></div></>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
