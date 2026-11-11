import type { User } from './types';

export type Role = 'owner' | 'manager' | 'entry';

export type Capability =
  /* Recording */
  | 'record.milk'
  | 'record.sales'
  | 'record.health'
  | 'record.attendance'
  /* Editing */
  | 'edit.any'
  | 'delete.any'
  /* Money */
  | 'payroll.view'
  | 'payroll.approve'
  | 'reports.view'
  | 'reports.profit'
  | 'expenses.record'
  /* Oversight */
  | 'audit.view'
  /* Administration */
  | 'users.manage'
  | 'settings.manage'
  | 'prices.manage'
  | 'backup.manage'
  | 'demo.reset';

/**
 * What each role may do. The owner holds every capability.
 * The manager runs the farm day to day: they see money, approve payroll and
 * read the audit log, but they cannot manage users, change prices and
 * settings, take or restore backups, reset the demo data, or delete the
 * farm's permanent records.
 */
const CAPABILITIES: Record<Role, Capability[]> = {
  owner: [
    'record.milk', 'record.sales', 'record.health', 'record.attendance',
    'edit.any', 'delete.any',
    'payroll.view', 'payroll.approve', 'reports.view', 'reports.profit', 'expenses.record',
    'audit.view',
    'users.manage', 'settings.manage', 'prices.manage', 'backup.manage', 'demo.reset'
  ],
  manager: [
    'record.milk', 'record.sales', 'record.health', 'record.attendance',
    'edit.any',
    'payroll.view', 'reports.view', 'reports.profit', 'expenses.record',
    'audit.view'
  ],
  entry: [
    'record.milk', 'record.sales', 'record.health', 'record.attendance'
  ]
};

export function can(user: User | null | undefined, capability: Capability): boolean {
  if (!user) return false;
  return CAPABILITIES[user.role as Role]?.includes(capability) ?? false;
}

/** Human wording for the permission matrix in Settings and for refusal messages. */
export const CAPABILITY_LABELS: Record<Capability, string> = {
  'record.milk': 'Record milk',
  'record.sales': 'Record sales',
  'record.health': 'Record health events',
  'record.attendance': 'Mark attendance',
  'edit.any': 'Edit any record',
  'delete.any': 'Delete records',
  'payroll.view': 'View payroll and salaries',
  'payroll.approve': 'Approve payroll',
  'reports.view': 'View reports',
  'reports.profit': 'See profit and loss',
  'expenses.record': 'Record expenses',
  'audit.view': 'View audit log',
  'users.manage': 'Manage users and permissions',
  'settings.manage': 'Change farm settings',
  'prices.manage': 'Change milk prices',
  'backup.manage': 'Create and restore backups',
  'demo.reset': 'Reset demo data'
};

/** Capabilities the owner has that the manager does not. Used to explain the split. */
export const OWNER_ONLY: Capability[] = [
  'users.manage', 'settings.manage', 'prices.manage', 'backup.manage', 'demo.reset', 'delete.any'
];
