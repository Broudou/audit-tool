export const ASSIGNMENT_ROLES = ['lead', 'member'] as const;

export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];

export const ASSIGNMENT_STATUSES = ['proposed', 'confirmed', 'declined', 'completed'] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
