export const AVAILABILITY_KINDS = ['working', 'unavailable', 'vacation'] as const;

export type AvailabilityKind = (typeof AVAILABILITY_KINDS)[number];

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export type Weekday = (typeof WEEKDAYS)[number];
