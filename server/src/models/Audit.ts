import { AUDIT_PRIORITIES, AUDIT_STATUSES, type AuditPriority, type AuditStatus } from '@audit-tool/shared';
import { Schema, Types, model, type Model } from 'mongoose';

export interface IAuditStatusHistoryEntry {
  status: AuditStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IAuditLocation {
  address?: string;
  timezone: string;
}

export interface IAudit {
  title: string;
  auditTypeId: Types.ObjectId;
  subject: string;
  status: AuditStatus;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  location: IAuditLocation;
  requiredSkills: string[];
  requiredAuditorCount: number;
  priority: AuditPriority;
  notes?: string;
  managerId: Types.ObjectId;
  createdBy: Types.ObjectId;
  statusHistory: IAuditStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IAuditStatusHistoryEntry>(
  {
    status: { type: String, enum: AUDIT_STATUSES, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, required: true, default: () => new Date() },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const auditSchema = new Schema<IAudit>(
  {
    title: { type: String, required: true, trim: true },
    auditTypeId: { type: Schema.Types.ObjectId, ref: 'AuditType', required: true },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: AUDIT_STATUSES, required: true, default: 'draft' },
    scheduledStart: { type: Date, default: null },
    scheduledEnd: { type: Date, default: null },
    location: {
      address: { type: String, trim: true },
      timezone: { type: String, required: true, default: 'UTC' },
    },
    requiredSkills: { type: [String], default: [] },
    requiredAuditorCount: { type: Number, default: 1, min: 1 },
    priority: { type: String, enum: AUDIT_PRIORITIES, default: 'medium' },
    notes: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

auditSchema.index({ status: 1 });
auditSchema.index({ scheduledStart: 1 });
auditSchema.index({ auditTypeId: 1 });
auditSchema.index({ managerId: 1 });

export const Audit: Model<IAudit> = model<IAudit>('Audit', auditSchema);
