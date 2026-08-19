import { Schema, Types, model, type Model } from 'mongoose';

export interface ITeam {
  name: string;
  managerId: Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

teamSchema.index({ managerId: 1 });

export const Team: Model<ITeam> = model<ITeam>('Team', teamSchema);
