export type Role = 'owner' | 'manager' | 'entry';
export type AnimalGroup = 'lactating' | 'dry' | 'heifer' | 'calf' | 'bull';
export type AnimalStatus = 'active' | 'sold' | 'died' | 'transferred';
export type CustomerType = 'individual' | 'shop' | 'cooperative' | 'walkin';
export type PaymentMethod = 'cash' | 'mpesa' | 'bank' | 'credit' | 'split';
export type Session = 'morning' | 'midday' | 'evening';

export interface User {
  id: string; name: string; email: string; phone: string; role: Role;
  password: string; active: boolean;
}

export interface Employee {
  id: string; name: string; nationalId: string; role: string; phone: string;
  salary: number; startDate: string; status: 'active' | 'inactive';
  emergencyContact: string; email: string;
}

export interface Animal {
  id: string; tag: string; name: string; breed: string; sex: 'F' | 'M';
  dob: string; motherTag: string; fatherTag: string; source: 'born' | 'purchased';
  purchaseDate: string; purchasePrice: number | null; group: AnimalGroup;
  status: AnimalStatus; statusDate: string; statusDetail: string;
  notes: string; photoColor: string; createdBy: string; updatedBy: string; updatedAt: string;
  exitBuyer?: string; exitPrice?: number; exitCause?: string; exitDestination?: string;
}

export interface BreedingEvent {
  id: string; animalId: string; type: 'heat' | 'insemination' | 'pregnancy' | 'calving';
  date: string; sire: string; method: string; result: string; notes: string;
  expectedCalving: string; calfTag: string; calfSex: string; calfOutcome: string;
}

export interface MilkRecord {
  id: string; date: string; session: Session; mode: 'percow' | 'batch';
  totalLitres: number; fat: number; scc: number; spoilage: number; spoilageReason: string;
  milkedBy: string; note: string; createdBy: string; updatedBy: string; updatedAt: string;
  synced: boolean;
}

export interface CowMilk {
  id: string; milkId: string; animalId: string; litres: number;
}

export interface MilkUsage {
  id: string; date: string; calves: number; home: number; wasted: number;
  updatedBy: string; updatedAt: string;
}

export interface Customer {
  id: string; name: string; type: Exclude<CustomerType, 'walkin'>; phone: string;
  email: string; pricePerLitre: number; creditLimit: number; balance: number;
  address: string; createdBy: string; updatedBy: string; updatedAt: string;
}

export interface Sale {
  id: string; receiptNo: string; invoiceNo: string; date: string; customerId: string;
  customerName: string; customerType: string; litres: number; pricePerLitre: number;
  total: number; paymentMethod: PaymentMethod; amountReceived: number; change: number;
  mpesaCode: string; bankRef: string; status: 'completed' | 'voided';
  voidReason: string; createdBy: string; updatedBy: string; updatedAt: string; synced: boolean;
}

export interface Invoice {
  id: string; invoiceNo: string; customerId: string; customerName: string;
  fromDate: string; toDate: string; litres: number; total: number;
  status: 'unpaid' | 'paid'; createdAt: string;
}

export interface Expense {
  id: string; date: string; category: string; supplier: string; amount: number;
  paymentMethod: string; linkedAnimal: string; payrollRunId: string; note: string;
  createdBy: string; updatedBy: string; updatedAt: string;
}

export interface HealthRecord {
  id: string; date: string; type: string; animalIds: string[]; product: string;
  dose: string; route: string; administeredBy: string; cost: number; notes: string;
  milkWithdrawalDays: number; meatWithdrawalDays: number; withdrawalEnd: string;
  attachments: string[]; createdBy: string; updatedBy: string; updatedAt: string;
}

export interface Vet { id: string; name: string; clinic: string; phone: string; }

export interface Attendance {
  id: string; employeeId: string; date: string; status: 'present' | 'absent' | 'leave' | 'half';
}

export interface Task {
  id: string; date: string; title: string; type: string; employeeId: string;
  done: boolean; source: string;
}

export interface LeaveRecord {
  id: string; employeeId: string; type: string; fromDate: string; toDate: string;
  status: 'approved' | 'pending' | 'rejected'; days: number;
}

export interface PayrollRun {
  id: string; month: string; status: 'draft' | 'approved';
  lines: PayrollLine[]; createdAt: string;
}

export interface PayrollLine {
  employeeId: string; basic: number; allowances: number; advances: number;
  absenceDeduction: number; paye: number; nhif: number; nssf: number; net: number;
}

export interface AuditEntry {
  id: string; user: string; action: string; module: string; record: string;
  oldValue: string; newValue: string; at: string;
}

export interface NotificationItem {
  id: string; title: string; body: string; category: string; read: boolean; at: string;
}

export interface MessageLog {
  id: string; channel: 'sms' | 'email'; to: string; body: string; status: string; at: string;
}

export interface Backup {
  id: string; date: string; size: string; status: 'success' | 'failed' | 'retried';
}

export interface Settings {
  farmName: string; location: string; phone: string; email: string;
  priceIndividual: number; priceShop: number; priceCoop: number;
  reconThreshold: number; tillNumber: string; paybillNumber: string;
  smsSender: string; emailSender: string; reminderDays: number;
  payeRate: number; nhifRate: number; nssfRate: number;
  simulateOffline: boolean;
}

export interface Permission {
  role: Role; module: string; view: boolean; create: boolean; edit: boolean; del: boolean;
}
