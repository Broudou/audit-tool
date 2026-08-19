import {
  ASSIGNMENT_ROLES,
  ASSIGNMENT_STATUSES,
  type AssignmentRole,
  type AssignmentStatus,
} from '@audit-tool/shared';
import { Schema, Types, model, type Model } from 'mongoose';

export interface IAssignment {
  auditId: Types.ObjectId;
  auditorId: Types.ObjectId;
  role: AssignmentRole;
  start: Date;
  end: Date;
  status: AssignmentStatus;
  assignedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    auditId: { type: Schema.Types.ObjectId, ref: 'Audit', required: true },
    auditorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ASSIGNMENT_ROLES, default: 'member' },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: 'proposed' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

assignmentSchema.index({ auditorId: 1, start: 1, end: 1 });
assignmentSchema.index({ auditId: 1 });

export const Assignment: Model<IAssignment> = model<IAssignment>('Assignment', assignmentSchema);
