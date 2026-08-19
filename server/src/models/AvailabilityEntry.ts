import { AVAILABILITY_KINDS, WEEKDAYS, type AvailabilityKind, type Weekday } from '@audit-tool/shared';
import { Schema, Types, model, type Model } from 'mongoose';

export interface IRecurrence {
  daysOfWeek: Weekday[];
  startTime: string;
  endTime: string;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
}

export interface IAvailabilityEntry {
  auditorId: Types.ObjectId;
  kind: AvailabilityKind;
  recurrence: IRecurrence | null;
  startDateTime: Date | null;
  endDateTime: Date | null;
  timezone: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recurrenceSchema = new Schema<IRecurrence>(
  {
    daysOfWeek: { type: [String], enum: WEEKDAYS, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveUntil: { type: Date, default: null },
  },
  { _id: false },
);

const availabilityEntrySchema = new Schema<IAvailabilityEntry>(
  {
    auditorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: AVAILABILITY_KINDS, required: true },
    recurrence: { type: recurrenceSchema, default: null },
    startDateTime: { type: Date, default: null },
    endDateTime: { type: Date, default: null },
    timezone: { type: String, required: true, default: 'UTC' },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

availabilityEntrySchema.index({ auditorId: 1, startDateTime: 1, endDateTime: 1 });

export const AvailabilityEntry: Model<IAvailabilityEntry> = model<IAvailabilityEntry>(
  'AvailabilityEntry',
  availabilityEntrySchema,
);
