import { ROLES, type Role } from '@audit-tool/shared';
import argon2 from 'argon2';
import {
  Schema,
  Types,
  model,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  teamId: Types.ObjectId | null;
  timezone: string;
  skills: string[];
  active: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    timezone: { type: String, required: true, default: 'UTC' },
    skills: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ teamId: 1 });

userSchema.methods.comparePassword = function comparePassword(
  this: HydratedDocument<IUser>,
  candidate: string,
): Promise<boolean> {
  return argon2.verify(this.passwordHash, candidate);
};

export const User = model<IUser, UserModel>('User', userSchema);

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}
