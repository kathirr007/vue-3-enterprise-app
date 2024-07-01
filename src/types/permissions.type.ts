export type OrgRoleName = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';
export const resources = [
  'tasks',
  'comments',
  'projects',
  'unscheduled_projects',
  'clients',
  'client_groups',
  'broadcast_templates',
  'broadcasts',
  'support_tasks',
  'users',
  'reports',
  'services',
  'subscriptions',
  'integrations',
  'designations',
  'business_entities',
  'dashboard',
  'holiday',
  'leave',
  'attendance',
  'client_billing',
  'document-signature',
  'billing',
  'payments',
  'invoices',
  'contacts',
  'webforms',
  'webform',
  'gallery'
] as const;

export const operations = [
  'admin',
  'create',
  'edit',
  'delete',
  'list',
  'single'
] as const;

export type ResourceType = (typeof resources)[number];
export type OperationType = (typeof operations)[number];
export interface UserPermissions {
  isOwner: boolean;
  orgRole: {
    name: OrgRoleName;
    permissions: {
      [key in ResourceType]: any;
    };
  };
}
