export const AUDIT_STATUSES = [
  'draft',
  'planned',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const AUDIT_PRIORITIES = ['low', 'medium', 'high'] as const;

export type AuditPriority = (typeof AUDIT_PRIORITIES)[number];
