import type { AssignmentRole, AssignmentStatus, AuditPriority, AuditStatus } from '@audit-tool/shared';
import { DateTime } from 'luxon';
import { Types, type HydratedDocument } from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { Assignment } from '../models/Assignment.js';
import { Audit, type IAuditStatusHistoryEntry } from '../models/Audit.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditType, type IAuditType } from '../models/AuditType.js';
import { AvailabilityEntry } from '../models/AvailabilityEntry.js';
import { Team } from '../models/Team.js';
import { User, hashPassword, type IUser } from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Every seeded account uses this password. It exists only for local/dev/demo databases.
 */
const SEED_PASSWORD = 'ChangeMe123!';

type HydratedUser = HydratedDocument<IUser>;
type HydratedAuditType = HydratedDocument<IAuditType>;

interface AuditSeedSpec {
  title: string;
  auditType: HydratedAuditType;
  subject: string;
  status: AuditStatus;
  manager: HydratedUser;
  daysFromNow: number;
  durationHours: number;
  priority: AuditPriority;
  progression: AuditStatus[];
  assignment?: {
    auditor: HydratedUser;
    role: AssignmentRole;
    status: AssignmentStatus;
  };
}

async function wipeCollections(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    AuditType.deleteMany({}),
    Audit.deleteMany({}),
    Assignment.deleteMany({}),
    AvailabilityEntry.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function logAction(
  actorId: Types.ObjectId | null,
  action: string,
  entityType: string,
  entityId: Types.ObjectId,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await AuditLog.create({ actorId, action, entityType, entityId, metadata: { ...metadata, seed: true } });
}

function buildHistory(
  progression: AuditStatus[],
  changedBy: Types.ObjectId,
  startingFrom: DateTime,
): IAuditStatusHistoryEntry[] {
  return progression.map((status, index) => ({
    status,
    changedBy,
    changedAt: startingFrom.plus({ days: index }).toJSDate(),
  }));
}

/**
 * Wipes and repopulates every collection with data covering every use case described in the
 * architecture plan: all three roles, both team structures, all four audit types, all seven
 * audit lifecycle statuses (including both cancellation paths), all three availability kinds
 * (recurring working pattern, one-off vacation, one-off unavailability, plus a one-off extra
 * working exception), assignments, and the audit-log trail behind each of those actions.
 */
export async function seedDatabase(): Promise<void> {
  await wipeCollections();

  const passwordHash = await hashPassword(SEED_PASSWORD);

  // --- Admin ---
  const admin = await User.create({
    email: 'admin@audit-tool.local',
    passwordHash,
    name: 'Ava Administrator',
    role: 'admin',
    timezone: 'UTC',
    skills: [],
  });
  await logAction(admin._id, 'user.created', 'User', admin._id, { role: 'admin' });

  // --- Managers & Teams ---
  const financeManager = await User.create({
    email: 'finance.manager@audit-tool.local',
    passwordHash,
    name: 'Marcus Finch',
    role: 'manager',
    timezone: 'America/New_York',
    skills: ['accounting'],
  });

  const securityManager = await User.create({
    email: 'security.manager@audit-tool.local',
    passwordHash,
    name: 'Priya Shah',
    role: 'manager',
    timezone: 'Europe/Paris',
    skills: ['infosec'],
  });

  await logAction(admin._id, 'user.created', 'User', financeManager._id, { role: 'manager' });
  await logAction(admin._id, 'user.created', 'User', securityManager._id, { role: 'manager' });

  const financeTeam = await Team.create({
    name: 'Financial Audits',
    managerId: financeManager._id,
    description: 'Handles SOX, financial compliance, and operational audits.',
  });

  const securityTeam = await Team.create({
    name: 'IT & Security Audits',
    managerId: securityManager._id,
    description: 'Handles information security and ISO audits.',
  });

  await logAction(admin._id, 'team.created', 'Team', financeTeam._id, { name: financeTeam.name });
  await logAction(admin._id, 'team.created', 'Team', securityTeam._id, { name: securityTeam.name });

  financeManager.teamId = financeTeam._id;
  await financeManager.save();
  securityManager.teamId = securityTeam._id;
  await securityManager.save();

  // --- Auditors ---
  const elenaTorres = await User.create({
    email: 'elena.torres@audit-tool.local',
    passwordHash,
    name: 'Elena Torres',
    role: 'auditor',
    teamId: financeTeam._id,
    timezone: 'America/New_York',
    skills: ['accounting', 'sox'],
  });

  const noahBecker = await User.create({
    email: 'noah.becker@audit-tool.local',
    passwordHash,
    name: 'Noah Becker',
    role: 'auditor',
    teamId: financeTeam._id,
    timezone: 'Europe/Paris',
    skills: ['accounting'],
  });

  const saraKim = await User.create({
    email: 'sara.kim@audit-tool.local',
    passwordHash,
    name: 'Sara Kim',
    role: 'auditor',
    teamId: financeTeam._id,
    timezone: 'Asia/Singapore',
    skills: ['operations'],
  });

  const liamOconnor = await User.create({
    email: 'liam.oconnor@audit-tool.local',
    passwordHash,
    name: "Liam O'Connor",
    role: 'auditor',
    teamId: securityTeam._id,
    timezone: 'America/New_York',
    skills: ['infosec', 'penetration-testing'],
  });

  const yukiTanaka = await User.create({
    email: 'yuki.tanaka@audit-tool.local',
    passwordHash,
    name: 'Yuki Tanaka',
    role: 'auditor',
    teamId: securityTeam._id,
    timezone: 'Asia/Tokyo',
    skills: ['infosec'],
  });

  const fatimaAlSayed = await User.create({
    email: 'fatima.alsayed@audit-tool.local',
    passwordHash,
    name: 'Fatima Al-Sayed',
    role: 'auditor',
    teamId: securityTeam._id,
    timezone: 'Europe/Paris',
    skills: ['quality-management', 'infosec'],
  });

  const auditors = [elenaTorres, noahBecker, saraKim, liamOconnor, yukiTanaka, fatimaAlSayed];
  for (const auditor of auditors) {
    await logAction(admin._id, 'user.created', 'User', auditor._id, { role: 'auditor' });
  }

  // --- Availability: recurring working pattern for every auditor ---
  const recurringEffectiveFrom = DateTime.utc().minus({ months: 2 }).startOf('day').toJSDate();
  for (const auditor of auditors) {
    await AvailabilityEntry.create({
      auditorId: auditor._id,
      kind: 'working',
      timezone: auditor.timezone,
      recurrence: {
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startTime: '09:00',
        endTime: '17:00',
        effectiveFrom: recurringEffectiveFrom,
        effectiveUntil: null,
      },
    });
  }

  // --- Availability: one-off vacation exception ---
  const vacationStart = DateTime.utc().plus({ weeks: 2 }).set({ weekday: 1 }).startOf('day');
  await AvailabilityEntry.create({
    auditorId: elenaTorres._id,
    kind: 'vacation',
    timezone: elenaTorres.timezone,
    startDateTime: vacationStart.toJSDate(),
    endDateTime: vacationStart.plus({ days: 5 }).toJSDate(),
    note: 'Annual leave',
  });

  // --- Availability: one-off unavailable exception (partial day) ---
  const unavailableDay = DateTime.utc().plus({ weeks: 1 }).set({ weekday: 3 }).startOf('day');
  await AvailabilityEntry.create({
    auditorId: noahBecker._id,
    kind: 'unavailable',
    timezone: noahBecker.timezone,
    startDateTime: unavailableDay.set({ hour: 9 }).toJSDate(),
    endDateTime: unavailableDay.set({ hour: 12 }).toJSDate(),
    note: 'Medical appointment',
  });

  // --- Availability: one-off extra working exception outside the recurring pattern ---
  const extraWorkingDay = DateTime.utc().plus({ weeks: 1 }).set({ weekday: 6 }).startOf('day');
  await AvailabilityEntry.create({
    auditorId: saraKim._id,
    kind: 'working',
    timezone: saraKim.timezone,
    startDateTime: extraWorkingDay.set({ hour: 9 }).toJSDate(),
    endDateTime: extraWorkingDay.set({ hour: 13 }).toJSDate(),
    note: 'Opted-in Saturday coverage',
  });

  // --- Audit types ---
  const financialType = await AuditType.create({
    name: 'Financial Compliance Audit',
    description: 'SOX and financial statement compliance review.',
    defaultDurationHours: 40,
    requiredSkills: ['accounting', 'sox'],
    colorTag: '#0b5fff',
  });

  const securityType = await AuditType.create({
    name: 'IT Security Audit',
    description: 'Infrastructure and application security assessment.',
    defaultDurationHours: 24,
    requiredSkills: ['infosec'],
    colorTag: '#b00020',
  });

  const operationalType = await AuditType.create({
    name: 'Operational Audit',
    description: 'Process efficiency and internal controls review.',
    defaultDurationHours: 16,
    requiredSkills: ['operations'],
    colorTag: '#0a7d3a',
  });

  const isoType = await AuditType.create({
    name: 'ISO 9001 Audit',
    description: 'Quality management system certification audit.',
    defaultDurationHours: 20,
    requiredSkills: ['quality-management'],
    colorTag: '#8a5a00',
  });

  for (const auditType of [financialType, securityType, operationalType, isoType]) {
    await logAction(admin._id, 'auditType.created', 'AuditType', auditType._id, {
      name: auditType.name,
    });
  }

  // --- Audits: one per lifecycle status, plus both cancellation paths ---
  const auditSpecs: AuditSeedSpec[] = [
    {
      title: 'Q1 Financial Statement Review',
      auditType: financialType,
      subject: 'Acme Manufacturing Corp',
      status: 'draft',
      manager: financeManager,
      daysFromNow: 30,
      durationHours: 40,
      priority: 'medium',
      progression: ['draft'],
    },
    {
      title: 'Vendor Payables Compliance Review',
      auditType: financialType,
      subject: 'Acme Manufacturing Corp',
      status: 'planned',
      manager: financeManager,
      daysFromNow: 21,
      durationHours: 24,
      priority: 'medium',
      progression: ['draft', 'planned'],
    },
    {
      title: 'Annual SOX Audit',
      auditType: financialType,
      subject: 'Northwind Holdings',
      status: 'scheduled',
      manager: financeManager,
      daysFromNow: 10,
      durationHours: 40,
      priority: 'high',
      progression: ['draft', 'planned', 'scheduled'],
      assignment: { auditor: elenaTorres, role: 'lead', status: 'confirmed' },
    },
    {
      title: 'Perimeter Penetration Test',
      auditType: securityType,
      subject: 'Contoso Retail Ltd',
      status: 'in_progress',
      manager: securityManager,
      daysFromNow: -1,
      durationHours: 24,
      priority: 'high',
      progression: ['draft', 'planned', 'scheduled', 'in_progress'],
      assignment: { auditor: liamOconnor, role: 'lead', status: 'confirmed' },
    },
    {
      title: 'Cloud Access Control Review',
      auditType: securityType,
      subject: 'Contoso Retail Ltd',
      status: 'completed',
      manager: securityManager,
      daysFromNow: -14,
      durationHours: 16,
      priority: 'medium',
      progression: ['draft', 'planned', 'scheduled', 'in_progress', 'completed'],
      assignment: { auditor: yukiTanaka, role: 'lead', status: 'completed' },
    },
    {
      title: 'Vendor Contract Compliance Audit',
      auditType: operationalType,
      subject: 'Globex Logistics',
      status: 'cancelled',
      manager: financeManager,
      daysFromNow: 5,
      durationHours: 16,
      priority: 'low',
      progression: ['draft', 'planned', 'cancelled'],
    },
    {
      title: 'Warehouse Safety Audit',
      auditType: operationalType,
      subject: 'Globex Logistics',
      status: 'cancelled',
      manager: financeManager,
      daysFromNow: 3,
      durationHours: 12,
      priority: 'low',
      progression: ['draft', 'planned', 'scheduled', 'cancelled'],
    },
    {
      title: 'ISO 9001 Recertification',
      auditType: isoType,
      subject: 'Globex Logistics',
      status: 'archived',
      manager: securityManager,
      daysFromNow: -60,
      durationHours: 20,
      priority: 'medium',
      progression: ['draft', 'planned', 'scheduled', 'in_progress', 'completed', 'archived'],
      assignment: { auditor: fatimaAlSayed, role: 'lead', status: 'completed' },
    },
  ];

  for (const spec of auditSpecs) {
    const wasScheduled = spec.progression.includes('scheduled');
    const start = DateTime.utc()
      .plus({ days: spec.daysFromNow })
      .set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    const end = start.plus({ hours: spec.durationHours });

    const audit = await Audit.create({
      title: spec.title,
      auditTypeId: spec.auditType._id,
      subject: spec.subject,
      status: spec.status,
      scheduledStart: wasScheduled ? start.toJSDate() : null,
      scheduledEnd: wasScheduled ? end.toJSDate() : null,
      location: { timezone: spec.manager.timezone },
      requiredSkills: spec.auditType.requiredSkills,
      requiredAuditorCount: 1,
      priority: spec.priority,
      managerId: spec.manager._id,
      createdBy: admin._id,
      statusHistory: buildHistory(
        spec.progression,
        spec.manager._id,
        DateTime.utc().plus({ days: spec.daysFromNow - spec.progression.length }),
      ),
    });

    for (const entry of audit.statusHistory) {
      await logAction(entry.changedBy, 'audit.status_changed', 'Audit', audit._id, {
        status: entry.status,
      });
    }

    if (spec.assignment) {
      const assignment = await Assignment.create({
        auditId: audit._id,
        auditorId: spec.assignment.auditor._id,
        role: spec.assignment.role,
        status: spec.assignment.status,
        start: start.toJSDate(),
        end: end.toJSDate(),
        assignedBy: spec.manager._id,
      });
      await logAction(spec.manager._id, 'assignment.created', 'Assignment', assignment._id, {
        auditId: audit._id.toString(),
        auditorId: spec.assignment.auditor._id.toString(),
      });
    }
  }
}

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    throw new Error(
      'Refusing to seed a database in NODE_ENV=production without --force. ' +
        'This operation wipes every collection. Re-run with --force if this is intentional.',
    );
  }

  await connectDatabase();
  logger.info('Connected to MongoDB — wiping and re-seeding all collections...');
  await seedDatabase();
  logger.info(`Seed complete. All seeded users share the password: ${SEED_PASSWORD}`);
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err: unknown) => {
      logger.error({ err }, 'Seeding failed');
      await disconnectDatabase().catch(() => undefined);
      process.exit(1);
    });
}
