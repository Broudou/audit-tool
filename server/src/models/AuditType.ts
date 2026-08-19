import { Schema, model, type Model } from 'mongoose';

export interface IAuditType {
  name: string;
  description?: string;
  defaultDurationHours: number;
  requiredSkills: string[];
  colorTag: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auditTypeSchema = new Schema<IAuditType>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    defaultDurationHours: { type: Number, required: true, min: 1 },
    requiredSkills: { type: [String], default: [] },
    colorTag: { type: String, default: '#0b5fff' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AuditType: Model<IAuditType> = model<IAuditType>('AuditType', auditTypeSchema);
