export const en = {
  appName: 'Mau Crest Hub',
  slogan: 'Nurtured by Nature, Delivered Fresh',
  farmName: 'Mau Crest Dairies',
  nav: {
    dashboard: 'Dashboard', livestock: 'Livestock', milk: 'Milk', sales: 'Sales (POS)',
    customers: 'Customers', expenses: 'Expenses', health: 'Health', labour: 'Labour',
    reports: 'Reports', notifications: 'Notifications', audit: 'Audit log', settings: 'Settings'
  },
  common: {
    save: 'Save', cancel: 'Cancel', close: 'Close', search: 'Search', add: 'Add',
    edit: 'Edit', delete: 'Delete', export: 'Export', print: 'Print', back: 'Back',
    loading: 'Loading', noResults: 'No records found', confirm: 'Confirm',
    online: 'Online', offline: 'Offline, changes saved on this device',
    syncNow: 'Sync now', waitingSync: 'Waiting to sync', undo: 'Undo',
    noPermission: 'You do not have permission to view this page.',
    lastEditedBy: 'Last edited by'
  },
  auth: {
    signIn: 'Sign in', emailOrPhone: 'Email or phone', password: 'Password',
    showPassword: 'Show password', forgot: 'Forgot password?', signOut: 'Sign out',
    switchRole: 'Switch demo role', demoOnly: 'Demo only'
  },
  milk: {
    record: 'Record milk', perCow: 'Per cow', perBatch: 'Per batch',
    morning: 'Morning', midday: 'Midday', evening: 'Evening',
    saveRecord: 'Save milk record', saved: 'Milk record saved'
  },
  sales: { newSale: 'New sale', recordSale: 'Record sale', saleSaved: 'Sale saved' },
  animals: { addAnimal: 'Add animal', saveAnimal: 'Save animal', animalSaved: 'Animal saved' },
  health: { addRecord: 'Add health record', saveRecord: 'Save health record', saved: 'Health record saved' },
  labour: { markAttendance: 'Mark attendance', attendanceSaved: 'Attendance saved' },
  reports: { exportExcel: 'Export to Excel', exportPdf: 'Export to PDF' }
};
export type Strings = typeof en;
