import { db } from '../lib/db';
import { mulberry32, uid, sum } from '../lib/utils';
import type { Animal, User, Employee, Customer, Sale, Expense, HealthRecord, MilkRecord, CowMilk, BreedingEvent, Attendance, Task, LeaveRecord, PayrollRun, AuditEntry, NotificationItem, MessageLog, Backup, Settings, Permission } from '../lib/types';

const rnd = mulberry32(20261111);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const ri = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
const rf = (a: number, b: number) => rnd() * (b - a) + a;
const dstr = (daysAgo: number) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};
const phone = () => `07${ri(10, 99)} ${ri(100, 999)} ${ri(100, 999)}`;
const mpesaCode = () => {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = ''; for (let i = 0; i < 10; i++) s += c[Math.floor(rnd() * c.length)];
  return s;
};

const NAMES = ['Amani', 'Baraka', 'Chepkoech', 'Neema', 'Zawadi', 'Wanjiku', 'Malkia', 'Tumaini', 'Nia', 'Sifa', 'Furaha', 'Zola', 'Kito', 'Jabali', 'Taji', 'Nuru', 'Bahati', 'Imani', 'Raha', 'Upendo', 'Jasiri', 'Pendo', 'Zuri', 'Kali', 'Moyo', 'Sahara', 'Tunda', 'Vumilia', 'Wema', 'Zawadi', 'Asha', 'Bibi', 'Chuma', 'Dada', 'Esi', 'Fahari', 'Gani', 'Haki', 'Juma', 'Kamili'];
const BREEDS = ['Friesian', 'Friesian', 'Friesian', 'Friesian', 'Ayrshire', 'Jersey', 'Guernsey', 'Friesian-Jersey cross'];
const COLORS = ['#1F4D2E', '#B7892B', '#1D4E7A', '#8F5200', '#596658', '#A8321F'];

/** The demo accounts. Kept in one place so a stale database can always sign in. */
export const DEMO_USERS: User[] = [
  { id: 'u1', name: 'Peter Kinyanjui', email: 'owner@maucrest.co.ke', phone: '0712 345 678', role: 'owner', password: 'owner123', active: true },
  { id: 'u2', name: 'Samuel Kiprono', email: 'samuel@maucrest.co.ke', phone: '0722 456 789', role: 'manager', password: 'manager123', active: true },
  { id: 'u3', name: 'Grace Wanjiru', email: 'grace@maucrest.co.ke', phone: '0733 567 890', role: 'manager', password: 'manager123', active: true },
  { id: 'u4', name: 'Daniel Kipchirchir', email: 'daniel@maucrest.co.ke', phone: '0744 678 901', role: 'entry', password: 'entry123', active: true },
  { id: 'u5', name: 'Faith Chebet', email: 'faith@maucrest.co.ke', phone: '0755 789 012', role: 'entry', password: 'entry123', active: true },
  { id: 'u6', name: 'Brian Otieno', email: 'brian@maucrest.co.ke', phone: '0766 890 123', role: 'entry', password: 'entry123', active: true },
  { id: 'u7', name: 'Mercy Njeri', email: 'mercy@maucrest.co.ke', phone: '0777 901 234', role: 'entry', password: 'entry123', active: true },
  { id: 'u8', name: 'Agnes Wambui', email: 'agnes@maucrest.co.ke', phone: '0788 012 345', role: 'entry', password: 'entry123', active: true }
];

/**
 * Make sure every demo account exists with the documented password.
 * Runs on every app start, not only first load, so a browser holding an older
 * copy of the demo data can still sign in as owner, manager or data entry.
 */
export async function syncDemoUsers() {
  for (const u of DEMO_USERS) {
    const existing = await db.users.get(u.id);
    if (!existing) {
      await db.users.add(u);
      continue;
    }
    if (existing.password !== u.password || existing.email !== u.email || existing.active !== true) {
      await db.users.put({ ...existing, email: u.email, phone: u.phone, password: u.password, role: u.role, active: true });
    }
  }
  // If no user rows at all exist (cleared database), restore the full set.
  if ((await db.users.count()) === 0) {
    await db.users.bulkAdd(DEMO_USERS);
  }
}

export async function seedIfEmpty() {
  const count = await db.animals.count();
  if (count > 0) {
    await syncDemoUsers();
    return;
  }
  await seedAll();
  await syncDemoUsers();
}

export async function resetData() {
  await Promise.all([
    db.users.clear(), db.employees.clear(), db.animals.clear(), db.breeding.clear(),
    db.milk.clear(), db.cowMilk.clear(), db.milkUsage.clear(), db.customers.clear(),
    db.sales.clear(), db.invoices.clear(), db.expenses.clear(), db.health.clear(),
    db.vets.clear(), db.attendance.clear(), db.tasks.clear(), db.leave.clear(),
    db.payroll.clear(), db.audit.clear(), db.notifications.clear(), db.messages.clear(),
    db.backups.clear(), db.settings.clear(), db.permissions.clear()
  ]);
  await seedAll();
}

async function seedAll() {
  const users: User[] = DEMO_USERS;
  await db.users.bulkAdd(DEMO_USERS);

  const empData: [string, string, number][] = [
    ['Samuel Kiprono', 'Farm manager', 55000], ['Grace Wanjiru', 'Accounts and sales', 48000],
    ['Daniel Kipchirchir', 'Head milker', 32000], ['Faith Chebet', 'Milker', 24000],
    ['Brian Otieno', 'Milker', 24000], ['Joseph Mutua', 'Feeder', 22000],
    ['Mercy Njeri', 'Calf attendant', 21000], ['Agnes Wambui', 'Dairy sales attendant', 20000],
    ['Kevin Maina', 'Driver', 28000], ['Hassan Ali', 'Security', 15000]
  ];
  const employees: Employee[] = empData.map(([name, role, salary], i) => ({
    id: 'e' + (i + 1), name, role, salary,
    nationalId: '3' + ri(1000000, 9999999), phone: phone(),
    startDate: dstr(ri(200, 1200)), status: 'active',
    emergencyContact: phone(), email: name.toLowerCase().replace(/ /g, '.') + '@maucrest.co.ke'
  }));
  await db.employees.bulkAdd(employees);

  // Animals: 80 active + 6 exited
  const animals: Animal[] = [];
  const groups: Animal['group'][] = [
    ...Array(38).fill('lactating'), ...Array(9).fill('dry'),
    ...Array(8).fill('heifer'), ...Array(10).fill('heifer'),
    ...Array(12).fill('calf'), ...Array(3).fill('bull')
  ] as Animal['group'][];
  // fix: 38+9+8+10+12+3 = 80
  const tagOf = (i: number) => 'MC-' + String(i + 1).padStart(3, '0');
  const now = new Date().toISOString();
  for (let i = 0; i < 80; i++) {
    const g = groups[i];
    const sex = g === 'bull' ? 'M' : (g === 'calf' && i % 2 === 0 ? 'M' : 'F');
    const ageDays = g === 'calf' ? ri(30, 300) : g === 'heifer' ? ri(400, 900) : ri(1000, 3000);
    const dob = new Date(Date.now() - ageDays * 86400000).toISOString().slice(0, 10);
    const purchased = i >= 55;
    animals.push({
      id: 'a' + (i + 1), tag: tagOf(i), name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ' ' + (Math.floor(i / NAMES.length) + 1) : ''),
      breed: pick(BREEDS), sex, dob,
      motherTag: i >= 8 ? tagOf(ri(0, 7)) : '', fatherTag: i >= 8 ? 'MC-078' : '',
      source: purchased ? 'purchased' : 'born',
      purchaseDate: purchased ? dstr(ri(100, 800)) : '',
      purchasePrice: purchased ? ri(45000, 120000) : null,
      group: g, status: 'active', statusDate: '', statusDetail: '',
      notes: rnd() > 0.7 ? 'Good temperament, easy to milk.' : '',
      photoColor: pick(COLORS), createdBy: 'Peter Kinyanjui', updatedBy: 'Peter Kinyanjui', updatedAt: now
    });
  }
  const exited: Partial<Animal>[] = [
    { status: 'sold', exitBuyer: 'Kiptoo Dairy Farm, Eldoret', exitPrice: 95000 },
    { status: 'sold', exitBuyer: 'Nakuru Milk Traders', exitPrice: 88000 },
    { status: 'sold', exitBuyer: 'Molo Livestock Market', exitPrice: 72000 },
    { status: 'died', exitCause: 'Bloat, found dead in morning' },
    { status: 'transferred', exitDestination: 'Mau Crest Farm 2, Nyandarua' },
    { status: 'transferred', exitDestination: 'Mau Crest Farm 2, Nyandarua' }
  ];
  exited.forEach((e, i) => {
    animals.push({
      id: 'ax' + (i + 1), tag: 'MC-0' + (81 + i), name: NAMES[(i * 3) % NAMES.length],
      breed: pick(BREEDS), sex: 'F', dob: dstr(ri(1500, 2500)),
      motherTag: '', fatherTag: '', source: 'born', purchaseDate: '', purchasePrice: null,
      group: 'dry', status: e.status as Animal['status'], statusDate: dstr(ri(20, 200)),
      statusDetail: e.exitCause || e.exitDestination || '', notes: '',
      photoColor: pick(COLORS), createdBy: 'Peter Kinyanjui', updatedBy: 'Peter Kinyanjui', updatedAt: now,
      exitBuyer: e.exitBuyer, exitPrice: e.exitPrice, exitCause: e.exitCause, exitDestination: e.exitDestination
    });
  });
  await db.animals.bulkAdd(animals);

  // Breeding events
  const breeding: BreedingEvent[] = [];
  const lactating = animals.filter(a => a.group === 'lactating' && a.status === 'active');
  lactating.forEach((a, idx) => {
    const base = ri(20, 300);
    breeding.push({ id: uid(), animalId: a.id, type: 'heat', date: dstr(base), sire: 'MC-078', method: '', result: '', notes: '', expectedCalving: '', calfTag: '', calfSex: '', calfOutcome: '' });
    breeding.push({ id: uid(), animalId: a.id, type: 'insemination', date: dstr(base - 3), sire: 'MC-078', method: 'AI', result: '', notes: 'Technician: J. Kiptoo', expectedCalving: '', calfTag: '', calfSex: '', calfOutcome: '' });
    if (idx % 3 !== 0) {
      const exp = new Date(Date.now() + ri(5, 85) * 86400000).toISOString().slice(0, 10);
      breeding.push({ id: uid(), animalId: a.id, type: 'pregnancy', date: dstr(base - 60), sire: '', method: 'Rectal palpation', result: 'Positive', notes: '', expectedCalving: exp, calfTag: '', calfSex: '', calfOutcome: '' });
    }
  });
  for (let i = 0; i < 6; i++) {
    breeding.push({ id: uid(), animalId: lactating[i].id, type: 'calving', date: dstr(ri(30, 330)), sire: 'MC-078', method: '', result: '', notes: '', expectedCalving: '', calfTag: 'MC-0' + (81 + i), calfSex: i % 2 ? 'F' : 'M', calfOutcome: 'Live, healthy' });
  }
  await db.breeding.bulkAdd(breeding);

  // Milk: 90 days x 3 sessions
  const milk: MilkRecord[] = [];
  const cowMilk: CowMilk[] = [];
  const milkers = ['e3', 'e4', 'e5'];
  const highScc = new Set([lactating[2].id, lactating[5].id, lactating[9].id]);
  const lowYield = new Set([lactating[7].id, lactating[12].id]);
  for (let d = 89; d >= 0; d--) {
    const date = dstr(d);
    const sessions: ('morning' | 'midday' | 'evening')[] = ['morning', 'midday', 'evening'];
    for (const sess of sessions) {
      const mid = uid();
      const fat = rf(3.4, 4.4);
      const scc = rnd() > 0.9 ? ri(500000, 700000) : ri(120000, 400000);
      const spoilage = rnd() > 0.93 ? rf(5, 20) : 0;
      let total = 0;
      lactating.forEach(a => {
        let base = lowYield.has(a.id) ? rf(4, 8) : rf(8, 28);
        if (sess === 'midday') base *= 0.55;
        if (sess === 'evening') base *= 0.7;
        const litres = Math.round(base * 10) / 10;
        total += litres;
        cowMilk.push({ id: uid(), milkId: mid, animalId: a.id, litres });
      });
      milk.push({
        id: mid, date, session: sess, mode: 'percow',
        totalLitres: Math.round(total * 10) / 10, fat: Math.round(fat * 10) / 10,
        scc, spoilage: Math.round(spoilage * 10) / 10,
        spoilageReason: spoilage > 0 ? 'Power cut, milk not cooled in time' : '',
        milkedBy: pick(milkers), note: '', createdBy: pick(users).name, updatedBy: pick(users).name,
        updatedAt: now, synced: true
      });
    }
  }
  await db.milk.bulkAdd(milk);
  await db.cowMilk.bulkAdd(cowMilk);
  // Usage
  const usage = [];
  for (let d = 89; d >= 0; d--) {
    const date = dstr(d);
    const dayTotal = sum(milk.filter(m => m.date === date).map(m => m.totalLitres));
    const calves = rf(30, 50), home = rf(10, 20), wasted = rf(0, 5);
    usage.push({ id: uid(), date, calves: Math.round(calves * 10) / 10, home: Math.round(home * 10) / 10, wasted: Math.round(wasted * 10) / 10, updatedBy: 'Grace Wanjiru', updatedAt: now });
  }
  await db.milkUsage.bulkAdd(usage);

  // Customers
  const custNames: [string, string][] = [
    ['Mary Wanjiru', 'individual'], ['John Kamau', 'individual'], ['Jane Achieng', 'individual'],
    ['Peter Mwangi', 'individual'], ['Susan Njeri', 'individual'], ['David Kiprop', 'individual'],
    ['Ann Wambui', 'individual'], ['George Onyango', 'individual'],
    ['Molo Mini Supermarket', 'shop'], ['Kiptoo Stores', 'shop'], ['Rongai Fresh Mart', 'shop'],
    ['Nakuru City Dairy', 'shop'], ['Elburgon General Stores', 'shop'], ['Molo Town Bakery', 'shop'],
    ['Chepkoech Retail Shop', 'shop'], ['Olenguruone Trading Co.', 'shop'], ['Turi Market Stores', 'shop'],
    ['Kuresoi Agrovet', 'shop'], ['Mau Summit Hotel', 'shop'],
    ['Nakuru County Dairy Cooperative', 'cooperative'], ['Molo Milk Farmers Co-op', 'cooperative'], ['Rongai Dairy Union', 'cooperative']
  ];
  const customers: Customer[] = custNames.map(([name, type], i) => {
    const price = type === 'individual' ? 80 : type === 'shop' ? 65 : 55;
    const onCredit = i < 6;
    return {
      id: 'c' + (i + 1), name, type: type as Customer['type'], phone: phone(),
      email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.co.ke',
      pricePerLitre: price, creditLimit: onCredit ? ri(50000, 120000) : 0,
      balance: onCredit ? ri(15000, 60000) : 0, address: 'Molo, Nakuru County',
      createdBy: 'Grace Wanjiru', updatedBy: 'Grace Wanjiru', updatedAt: now
    };
  });
  // Adjust balances to total ~186k
  const target = 186000;
  const cur = sum(customers.map(c => c.balance));
  customers.forEach(c => { if (c.balance > 0) c.balance = Math.round(c.balance * (target / cur)); });
  await db.customers.bulkAdd(customers);

  // Sales: 90 days matching milk
  const sales: Sale[] = [];
  let receipt = 1;
  const methods: Sale['paymentMethod'][] = ['cash', 'mpesa', 'bank', 'credit', 'cash', 'mpesa'];
  for (let d = 89; d >= 0; d--) {
    const date = dstr(d);
    const dayTotal = sum(milk.filter(m => m.date === date).map(m => m.totalLitres));
    const usageDay = usage.find(u => u.date === date);
    const sold = Math.max(0, dayTotal - (usageDay ? usageDay.calves + usageDay.home + usageDay.wasted : 40));
    let remaining = sold;
    while (remaining > 5) {
      const c = pick(customers);
      const litres = Math.min(remaining, rf(5, 60));
      remaining -= litres;
      const method = pick(methods);
      const total = Math.round(litres * c.pricePerLitre);
      sales.push({
        id: uid(), receiptNo: 'MC-R-' + String(receipt++).padStart(6, '0'),
        invoiceNo: '', date, customerId: c.id, customerName: c.name, customerType: c.type,
        litres: Math.round(litres * 10) / 10, pricePerLitre: c.pricePerLitre, total,
        paymentMethod: method, amountReceived: method === 'cash' ? total + pick([0, 0, 50, 100]) : total,
        change: method === 'cash' ? 0 : 0, mpesaCode: method === 'mpesa' ? mpesaCode() : '',
        bankRef: method === 'bank' ? 'BANK' + ri(100000, 999999) : '',
        status: 'completed', voidReason: '', createdBy: pick(users).name, updatedBy: pick(users).name,
        updatedAt: now, synced: true
      });
    }
  }
  // fix cash change
  sales.forEach(s => { if (s.paymentMethod === 'cash') s.change = Math.max(0, s.amountReceived - s.total); });
  await db.sales.bulkAdd(sales);

  // Invoices
  const invoices = customers.filter(c => c.type !== 'individual').slice(0, 8).map((c, i) => ({
    id: uid(), invoiceNo: 'MC-INV-2026-' + String(i + 1).padStart(4, '0'),
    customerId: c.id, customerName: c.name, fromDate: dstr(30), toDate: dstr(1),
    litres: Math.round(rf(800, 1500) * 10) / 10, total: Math.round(rf(40000, 90000)),
    status: (i % 2 === 0 ? 'paid' : 'unpaid') as 'paid' | 'unpaid', createdAt: now
  }));
  await db.invoices.bulkAdd(invoices);

  // Expenses: 12 months
  const cats = ['Feed', 'Drugs and veterinary', 'Wages', 'Utilities', 'Transport', 'Repairs', 'Other'];
  const weights = [0.38, 0.08, 0.25, 0.08, 0.08, 0.07, 0.06];
  const expenses: Expense[] = [];
  for (let m = 11; m >= 0; m--) {
    const monthTotal = rf(650000, 700000);
    cats.forEach((cat, ci) => {
      const n = cat === 'Feed' ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const amt = (monthTotal * weights[ci]) / n * rf(0.8, 1.2);
        const day = ri(1, 28);
        const dt = new Date(); dt.setMonth(dt.getMonth() - m); dt.setDate(day);
        expenses.push({
          id: uid(), date: dt.toISOString().slice(0, 10), category: cat,
          supplier: cat === 'Feed' ? 'Nakuru Feeds Ltd' : cat === 'Drugs and veterinary' ? 'Highland Vet Clinic' : 'Local supplier',
          amount: Math.round(amt), paymentMethod: pick(['cash', 'bank', 'mpesa']),
          linkedAnimal: '', payrollRunId: '', note: '', createdBy: 'Grace Wanjiru', updatedBy: 'Grace Wanjiru', updatedAt: now
        });
      }
    });
  }
  await db.expenses.bulkAdd(expenses);

  // Health
  await db.vets.bulkAdd([
    { id: 'v1', name: 'Dr. Wilson Kamau', clinic: 'Highland Vet Clinic', phone: '0720 111 222' },
    { id: 'v2', name: 'Dr. Faith Moraa', clinic: 'Nakuru Veterinary Services', phone: '0730 333 444' }
  ]);
  const health: HealthRecord[] = [];
  const types = ['Vaccination', 'Treatment', 'Deworming', 'Vet visit', 'Test'];
  const products: Record<string, string[]> = {
    Vaccination: ['Foot and mouth vaccine', 'Lumpy skin disease vaccine', 'Brucellosis vaccine', 'East Coast fever vaccine'],
    Treatment: ['Oxytetracycline 20%', 'Penicillin G', 'Ivermectin', 'Mastitis tube'],
    Deworming: ['Albendazole 10%', 'Levamisole'],
    'Vet visit': ['General check-up', 'Pregnancy examination'],
    Test: ['CMT test', 'TB test', 'Brucellosis test']
  };
  for (let i = 0; i < 120; i++) {
    const type = pick(types);
    const nAnimals = rnd() > 0.6 ? ri(5, 20) : 1;
    const ids: string[] = [];
    for (let k = 0; k < nAnimals; k++) ids.push(pick(animals.filter(a => a.status === 'active')).id);
    const wd = type === 'Treatment' ? ri(3, 7) : 0;
    const date = dstr(ri(1, 360));
    health.push({
      id: uid(), date, type, animalIds: [...new Set(ids)],
      product: pick(products[type]), dose: type === 'Vaccination' ? '10 ml' : 'As directed',
      route: type === 'Vaccination' ? 'Intramuscular' : 'Oral',
      administeredBy: rnd() > 0.5 ? 'Dr. Wilson Kamau' : pick(employees).name,
      cost: ri(500, 8000), notes: '', milkWithdrawalDays: wd,
      meatWithdrawalDays: wd > 0 ? wd + 7 : 0,
      withdrawalEnd: wd > 0 ? new Date(new Date(date).getTime() + wd * 86400000).toISOString().slice(0, 10) : '',
      attachments: rnd() > 0.6 ? ['vet-report.pdf'] : [],
      createdBy: pick(users).name, updatedBy: pick(users).name, updatedAt: now
    });
  }
  // Ensure 4+ in withdrawal now
  for (let i = 0; i < 5; i++) {
    health.push({
      id: uid(), date: dstr(ri(1, 3)), type: 'Treatment', animalIds: [lactating[i].id],
      product: 'Mastitis tube', dose: '1 tube', route: 'Intramammary',
      administeredBy: 'Dr. Wilson Kamau', cost: 2500, notes: 'Mastitis treatment',
      milkWithdrawalDays: 5, meatWithdrawalDays: 12,
      withdrawalEnd: new Date(Date.now() + ri(1, 4) * 86400000).toISOString().slice(0, 10),
      attachments: [], createdBy: 'Daniel Kipchirchir', updatedBy: 'Daniel Kipchirchir', updatedAt: now
    });
  }
  await db.health.bulkAdd(health);

  // Attendance 90 days
  const attendance: Attendance[] = [];
  employees.forEach(e => {
    for (let d = 89; d >= 0; d--) {
      const r = rnd();
      const status = r > 0.92 ? 'absent' : r > 0.87 ? 'leave' : r > 0.84 ? 'half' : 'present';
      attendance.push({ id: uid(), employeeId: e.id, date: dstr(d), status });
    }
  });
  await db.attendance.bulkAdd(attendance);

  // Tasks
  const tasks: Task[] = [];
  const taskTypes = ['Milking', 'Feeding', 'Treatment', 'Cleaning', 'Delivery'];
  for (let d = 13; d >= 0; d--) {
    taskTypes.forEach(t => {
      tasks.push({ id: uid(), date: dstr(d), title: t + ' duty', type: t, employeeId: pick(employees).id, done: rnd() > 0.15, source: 'manual' });
    });
  }
  await db.tasks.bulkAdd(tasks);

  // Leave
  const leave: LeaveRecord[] = employees.slice(0, 6).map(e => ({
    id: uid(), employeeId: e.id, type: pick(['Annual', 'Sick', 'Compassionate']),
    fromDate: dstr(ri(10, 60)), toDate: dstr(ri(1, 9)), status: 'approved' as const, days: ri(2, 7)
  }));
  await db.leave.bulkAdd(leave);

  // Payroll last 3 months
  const payroll: PayrollRun[] = [];
  for (let m = 2; m >= 0; m--) {
    const dt = new Date(); dt.setMonth(dt.getMonth() - m);
    const month = dt.toISOString().slice(0, 7);
    const lines = employees.map(e => {
      const basic = e.salary;
      const allowances = Math.round(basic * 0.15);
      const advances = rnd() > 0.8 ? ri(2000, 8000) : 0;
      const absenceDeduction = rnd() > 0.85 ? ri(1000, 4000) : 0;
      const paye = Math.round((basic + allowances - advances) * 0.12);
      const nhif = Math.round(basic * 0.0275);
      const nssf = Math.round(basic * 0.06);
      const net = basic + allowances - advances - absenceDeduction - paye - nhif - nssf;
      return { employeeId: e.id, basic, allowances, advances, absenceDeduction, paye, nhif, nssf, net };
    });
    payroll.push({ id: uid(), month, status: m === 0 ? 'draft' : 'approved', lines, createdAt: now });
  }
  await db.payroll.bulkAdd(payroll);

  // Audit 150+
  const audit: AuditEntry[] = [];
  const modules = ['Livestock', 'Milk', 'Sales', 'Customers', 'Expenses', 'Health', 'Labour'];
  const actions = ['Created', 'Edited', 'Deleted', 'Status changed'];
  for (let i = 0; i < 160; i++) {
    const mod = pick(modules);
    audit.push({
      id: uid(), user: pick(users).name, action: pick(actions), module: mod,
      record: mod === 'Livestock' ? 'MC-' + String(ri(1, 86)).padStart(3, '0') : mod === 'Sales' ? 'MC-R-' + String(ri(1, 500)).padStart(6, '0') : mod + ' record',
      oldValue: rnd() > 0.5 ? 'Litres: 12.0' : 'Status: active',
      newValue: rnd() > 0.5 ? 'Litres: 14.5' : 'Status: sold',
      at: new Date(Date.now() - ri(0, 89) * 86400000 - ri(0, 86000) * 1000).toISOString()
    });
  }
  await db.audit.bulkAdd(audit);

  // Notifications + messages
  const notifs: NotificationItem[] = [
    { id: uid(), title: 'Vaccination due', body: 'Foot and mouth vaccination due for 12 animals in 3 days.', category: 'health', read: false, at: now },
    { id: uid(), title: 'Calving expected', body: 'MC-014 Amani is expected to calve within 7 days.', category: 'health', read: false, at: now },
    { id: uid(), title: 'Milk withdrawal', body: 'MC-003 is in milk withdrawal until tomorrow.', category: 'health', read: false, at: now },
    { id: uid(), title: 'Credit overdue', body: 'Nakuru City Dairy owes KES 42,000, overdue by 30 days.', category: 'sales', read: false, at: now },
    { id: uid(), title: 'Backup complete', body: 'Daily backup finished successfully.', category: 'system', read: true, at: now },
    { id: uid(), title: 'Low stock of feed', body: 'Dairy meal below 2 weeks supply.', category: 'system', read: true, at: now }
  ];
  await db.notifications.bulkAdd(notifs);
  const messages: MessageLog[] = [];
  for (let i = 0; i < 20; i++) {
    messages.push({
      id: uid(), channel: rnd() > 0.5 ? 'sms' : 'email',
      to: pick(customers).phone, body: 'Your milk receipt MC-R-' + String(ri(1, 500)).padStart(6, '0') + ' is ready. Thank you for buying from Mau Crest Dairies.',
      status: 'sent', at: new Date(Date.now() - ri(0, 30) * 86400000).toISOString()
    });
  }
  await db.messages.bulkAdd(messages);

  // Backups 30 days
  const backups: Backup[] = [];
  for (let d = 29; d >= 0; d--) {
    backups.push({
      id: uid(), date: dstr(d), size: (rf(8, 15)).toFixed(1) + ' MB',
      status: d === 12 ? 'retried' : 'success'
    });
  }
  backups.push({ id: uid(), date: dstr(12), size: '—', status: 'failed' });
  await db.backups.bulkAdd(backups);

  const settings: Settings = {
    farmName: 'Mau Crest Dairies', location: 'Molo, Nakuru County',
    phone: '0712 345 678', email: 'info@maucrest.co.ke',
    priceIndividual: 80, priceShop: 65, priceCoop: 55,
    reconThreshold: 10, tillNumber: '567890', paybillNumber: '400100',
    smsSender: 'MAUCREST', emailSender: 'noreply@maucrest.co.ke',
    reminderDays: 7, payeRate: 12, nhifRate: 2.75, nssfRate: 6, simulateOffline: false
  };
  await db.settings.add({ ...settings, id: 'main' } as Settings & { id: string });

  const perms: Permission[] = [];
  const mods = ['dashboard', 'livestock', 'milk', 'sales', 'customers', 'expenses', 'health', 'labour', 'reports', 'notifications', 'audit', 'settings'];
  (['owner', 'manager', 'entry'] as const).forEach(role => {
    mods.forEach(m => {
      if (role === 'owner') perms.push({ role, module: m, view: true, create: true, edit: true, del: true });
      else if (role === 'manager') perms.push({ role, module: m, view: true, create: true, edit: true, del: m !== 'settings' });
      else perms.push({ role, module: m, view: !['audit', 'settings'].includes(m), create: ['milk', 'sales', 'health', 'labour'].includes(m), edit: ['milk', 'sales', 'health', 'labour'].includes(m), del: false });
    });
  });
  await db.permissions.bulkAdd(perms);
}
