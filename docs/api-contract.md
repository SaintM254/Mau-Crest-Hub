# Mock API contract

Every call in `src/api/index.ts` returns a Promise with 150–400 ms latency and reads/writes Dexie (IndexedDB) tables, so changes survive a refresh. A real backend should implement the same shapes. All dates are `YYYY-MM-DD`, timestamps ISO 8601, money in KES (whole numbers), milk in litres.

## Animals

- `listAnimals() -> Animal[]`
- `getAnimal(id) -> Animal | undefined`
- `saveAnimal(Animal) -> Animal` — create when `id` is new, update when it exists. Errors: duplicate tag (validate client-side), missing tag/name.
- `deleteAnimal(id) -> void`
- `listBreeding() -> BreedingEvent[]`, `saveBreeding(BreedingEvent) -> BreedingEvent`

Animal fields: `id, tag, name, breed, sex (F|M), dob, motherTag, fatherTag, source (born|purchased), purchaseDate, purchasePrice, group (lactating|dry|heifer|calf|bull), status (active|sold|died|transferred), statusDate, statusDetail, notes, photoColor, exitBuyer, exitPrice, exitCause, exitDestination, createdBy, updatedBy, updatedAt`.

## Milk

- `listMilk() -> MilkRecord[]`, `saveMilk(MilkRecord) -> MilkRecord`
- `listCowMilk() -> CowMilk[]`, `saveCowMilk(CowMilk[]) -> CowMilk[]`
- `listUsage() -> MilkUsage[]`, `saveUsage(MilkUsage) -> MilkUsage` (upsert by date)

MilkRecord: `id, date, session (morning|midday|evening), mode (percow|batch), totalLitres, fat, scc, spoilage, spoilageReason, milkedBy, note, createdBy, updatedBy, updatedAt, synced`.

## Sales and customers

- `listCustomers() -> Customer[]`, `saveCustomer(Customer) -> Customer`
- `listSales() -> Sale[]`, `saveSale(Sale) -> Sale`
- `listInvoices() -> Invoice[]`, `saveInvoice(Invoice) -> Invoice`

Sale: `id, receiptNo (MC-R-000001), invoiceNo, date, customerId, customerName, customerType, litres, pricePerLitre, total, paymentMethod (cash|mpesa|bank|credit|split), amountReceived, change, mpesaCode, bankRef, status (completed|voided), voidReason, createdBy, updatedBy, updatedAt, synced`.

## Expenses

- `listExpenses() -> Expense[]`, `saveExpense(Expense) -> Expense`

Expense: `id, date, category, supplier, amount, paymentMethod, linkedAnimal, payrollRunId, note, createdBy, updatedBy, updatedAt`.

## Health

- `listHealth() -> HealthRecord[]`, `saveHealth(HealthRecord) -> HealthRecord`
- `listVets() -> Vet[]`

HealthRecord: `id, date, type, animalIds[], product, dose, route, administeredBy, cost, notes, milkWithdrawalDays, meatWithdrawalDays, withdrawalEnd, attachments[], createdBy, updatedBy, updatedAt`.

## Labour

- `listEmployees() -> Employee[]`
- `listAttendance() -> Attendance[]`, `saveAttendance(Attendance[]) -> Attendance[]` (upsert by employee+date)
- `listTasks() -> Task[]`, `saveTask(Task) -> Task`
- `listLeave() -> LeaveRecord[]`
- `listPayroll() -> PayrollRun[]`, `savePayroll(PayrollRun) -> PayrollRun`

PayrollRun: `id, month (YYYY-MM), status (draft|approved), lines[] {employeeId, basic, allowances, advances, absenceDeduction, paye, nhif, nssf, net}, createdAt`.

## System

- `listAudit() -> AuditEntry[]`, `addAudit(AuditEntry) -> AuditEntry`
- `listNotifications() -> NotificationItem[]`, `markAllRead() -> void`
- `listMessages() -> MessageLog[]`, `sendMessage({channel, to, body}) -> MessageLog` (mock send)
- `listBackups() -> Backup[]`, `backupNow() -> Backup`
- `getSettings() -> Settings`, `saveSettings(Settings) -> Settings`
- `listPermissions() -> Permission[]`, `savePermissions(Permission[]) -> Permission[]`
- `listUsers() -> User[]`, `saveUser(User) -> User`

## Errors

Mock calls never throw in the demo except on Dexie failure. A real backend should return 4xx with `{ error: "message" }` for validation failures and 5xx for server errors. The UI shows inline errors and toasts.
