import Dexie, { type Table } from 'dexie';
import type {
  User, Employee, Animal, BreedingEvent, MilkRecord, CowMilk, MilkUsage,
  Customer, Sale, Invoice, Expense, HealthRecord, Vet, Attendance, Task,
  LeaveRecord, PayrollRun, AuditEntry, NotificationItem, MessageLog,
  Backup, Settings, Permission
} from './types';

class HubDB extends Dexie {
  users!: Table<User, string>;
  employees!: Table<Employee, string>;
  animals!: Table<Animal, string>;
  breeding!: Table<BreedingEvent, string>;
  milk!: Table<MilkRecord, string>;
  cowMilk!: Table<CowMilk, string>;
  milkUsage!: Table<MilkUsage, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  invoices!: Table<Invoice, string>;
  expenses!: Table<Expense, string>;
  health!: Table<HealthRecord, string>;
  vets!: Table<Vet, string>;
  attendance!: Table<Attendance, string>;
  tasks!: Table<Task, string>;
  leave!: Table<LeaveRecord, string>;
  payroll!: Table<PayrollRun, string>;
  audit!: Table<AuditEntry, string>;
  notifications!: Table<NotificationItem, string>;
  messages!: Table<MessageLog, string>;
  backups!: Table<Backup, string>;
  settings!: Table<Settings, string>;
  permissions!: Table<Permission, string>;

  constructor() {
    super('MauCrestHub');
    this.version(1).stores({
      users: 'id', employees: 'id', animals: 'id, tag, status, group',
      breeding: 'id, animalId, date', milk: 'id, date, session',
      cowMilk: 'id, milkId, animalId', milkUsage: 'id, date',
      customers: 'id, type', sales: 'id, date, customerId, receiptNo',
      invoices: 'id, customerId', expenses: 'id, date, category',
      health: 'id, date', vets: 'id', attendance: 'id, employeeId, date',
      tasks: 'id, date, employeeId', leave: 'id, employeeId',
      payroll: 'id, month', audit: 'id, at, module',
      notifications: 'id, at', messages: 'id, at', backups: 'id, date',
      settings: 'id', permissions: 'id'
    });
  }
}

export const db = new HubDB();
