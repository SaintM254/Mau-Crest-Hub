import { db } from '../lib/db';
import { uid } from '../lib/utils';

const delay = () => new Promise(r => setTimeout(r, 150 + Math.random() * 250));

export const api = {
  async listAnimals() { await delay(); return db.animals.toArray(); },
  async getAnimal(id: string) { await delay(); return db.animals.get(id); },
  async saveAnimal(a: any) {
    await delay();
    if (a.id && await db.animals.get(a.id)) { await db.animals.put(a); return a; }
    const n = { ...a, id: uid() }; await db.animals.add(n); return n;
  },
  async deleteAnimal(id: string) { await delay(); return db.animals.delete(id); },
  async listMilk() { await delay(); return db.milk.toArray(); },
  async saveMilk(m: any) {
    await delay();
    if (m.id && await db.milk.get(m.id)) { await db.milk.put(m); return m; }
    const n = { ...m, id: uid() }; await db.milk.add(n); return n;
  },
  async listCowMilk() { await delay(); return db.cowMilk.toArray(); },
  async saveCowMilk(rows: any[]) { await delay(); await db.cowMilk.bulkAdd(rows); return rows; },
  async listUsage() { await delay(); return db.milkUsage.toArray(); },
  async saveUsage(u: any) {
    await delay();
    const ex = await db.milkUsage.where('date').equals(u.date).first();
    if (ex) { await db.milkUsage.put({ ...ex, ...u }); return { ...ex, ...u }; }
    const n = { ...u, id: uid() }; await db.milkUsage.add(n); return n;
  },
  async listCustomers() { await delay(); return db.customers.toArray(); },
  async saveCustomer(c: any) {
    await delay();
    if (c.id && await db.customers.get(c.id)) { await db.customers.put(c); return c; }
    const n = { ...c, id: uid() }; await db.customers.add(n); return n;
  },
  async listSales() { await delay(); return db.sales.toArray(); },
  async saveSale(s: any) {
    await delay();
    if (s.id && await db.sales.get(s.id)) { await db.sales.put(s); return s; }
    const n = { ...s, id: uid() }; await db.sales.add(n); return n;
  },
  async listInvoices() { await delay(); return db.invoices.toArray(); },
  async saveInvoice(i: any) {
    await delay();
    if (i.id && await db.invoices.get(i.id)) { await db.invoices.put(i); return i; }
    const n = { ...i, id: uid() }; await db.invoices.add(n); return n;
  },
  async listExpenses() { await delay(); return db.expenses.toArray(); },
  async saveExpense(e: any) {
    await delay();
    if (e.id && await db.expenses.get(e.id)) { await db.expenses.put(e); return e; }
    const n = { ...e, id: uid() }; await db.expenses.add(n); return n;
  },
  async listHealth() { await delay(); return db.health.toArray(); },
  async saveHealth(h: any) {
    await delay();
    if (h.id && await db.health.get(h.id)) { await db.health.put(h); return h; }
    const n = { ...h, id: uid() }; await db.health.add(n); return n;
  },
  async listEmployees() { await delay(); return db.employees.toArray(); },
  async listAttendance() { await delay(); return db.attendance.toArray(); },
  async saveAttendance(rows: any[]) {
    await delay();
    for (const r of rows) {
      const ex = await db.attendance.where('[employeeId+date]').equals([r.employeeId, r.date]).first();
      if (ex) await db.attendance.put({ ...ex, status: r.status });
      else await db.attendance.add({ ...r, id: uid() });
    }
    return rows;
  },
  async listTasks() { await delay(); return db.tasks.toArray(); },
  async saveTask(t: any) {
    await delay();
    if (t.id && await db.tasks.get(t.id)) { await db.tasks.put(t); return t; }
    const n = { ...t, id: uid() }; await db.tasks.add(n); return n;
  },
  async listLeave() { await delay(); return db.leave.toArray(); },
  async listPayroll() { await delay(); return db.payroll.toArray(); },
  async savePayroll(p: any) {
    await delay();
    if (p.id && await db.payroll.get(p.id)) { await db.payroll.put(p); return p; }
    const n = { ...p, id: uid() }; await db.payroll.add(n); return n;
  },
  async listAudit() { await delay(); return db.audit.toArray(); },
  async addAudit(e: any) { await delay(); const n = { ...e, id: uid() }; await db.audit.add(n); return n; },
  async listNotifications() { await delay(); return db.notifications.toArray(); },
  async markAllRead() { await delay(); await db.notifications.toCollection().modify({ read: true }); },
  async listMessages() { await delay(); return db.messages.toArray(); },
  async sendMessage(m: any) {
    await delay();
    const n = { ...m, id: uid(), status: 'sent', at: new Date().toISOString() };
    await db.messages.add(n); return n;
  },
  async listBackups() { await delay(); return db.backups.toArray(); },
  async backupNow() {
    await delay();
    const n = { id: uid(), date: new Date().toISOString().slice(0, 10), size: '12.4 MB', status: 'success' as const };
    await db.backups.add(n); return n;
  },
  async getSettings() { await delay(); return db.settings.get('main'); },
  async saveSettings(s: any) { await delay(); await db.settings.put({ ...s, id: 'main' }); return s; },
  async listPermissions() { await delay(); return db.permissions.toArray(); },
  async savePermissions(p: any[]) {
    await delay();
    await db.permissions.clear();
    await db.permissions.bulkAdd(p);
    return p;
  },
  async listBreeding() { await delay(); return db.breeding.toArray(); },
  async saveBreeding(b: any) {
    await delay();
    if (b.id && await db.breeding.get(b.id)) { await db.breeding.put(b); return b; }
    const n = { ...b, id: uid() }; await db.breeding.add(n); return n;
  },
  async listUsers() { await delay(); return db.users.toArray(); },
  async saveUser(u: any) {
    await delay();
    if (u.id && await db.users.get(u.id)) { await db.users.put(u); return u; }
    const n = { ...u, id: uid() }; await db.users.add(n); return n;
  },
  async listVets() { await delay(); return db.vets.toArray(); }
};
