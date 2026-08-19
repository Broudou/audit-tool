import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('seedDatabase', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.SESSION_SECRET = 'test-session-secret-value-32-chars-min';
    process.env.CSRF_SECRET = 'test-csrf-secret-value-32-characters-min';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    await mongoose.connect(process.env.MONGODB_URI);
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('populates every collection and covers every documented use case', async () => {
    const { seedDatabase } = await import('../../src/scripts/seed.js');
    const { User } = await import('../../src/models/User.js');
    const { Team } = await import('../../src/models/Team.js');
    const { AuditType } = await import('../../src/models/AuditType.js');
    const { Audit } = await import('../../src/models/Audit.js');
    const { Assignment } = await import('../../src/models/Assignment.js');
    const { AvailabilityEntry } = await import('../../src/models/AvailabilityEntry.js');
    const { AuditLog } = await import('../../src/models/AuditLog.js');

    await seedDatabase();

    const roles = await User.distinct('role');
    expect(new Set(roles)).toEqual(new Set(['admin', 'manager', 'auditor']));
    expect(await User.countDocuments()).toBe(9);

    expect(await Team.countDocuments()).toBe(2);
    expect(await AuditType.countDocuments()).toBe(4);

    const statuses = await Audit.distinct('status');
    expect(new Set(statuses)).toEqual(
      new Set(['draft', 'planned', 'scheduled', 'in_progress', 'completed', 'cancelled', 'archived']),
    );
    expect(await Audit.countDocuments({ status: 'cancelled' })).toBe(2);

    const kinds = await AvailabilityEntry.distinct('kind');
    expect(new Set(kinds)).toEqual(new Set(['working', 'unavailable', 'vacation']));

    expect(await Assignment.countDocuments()).toBe(4);

    const auditLogActions = await AuditLog.distinct('action');
    expect(new Set(auditLogActions)).toEqual(
      new Set([
        'user.created',
        'team.created',
        'auditType.created',
        'audit.status_changed',
        'assignment.created',
      ]),
    );

    // Re-running the seed should be idempotent (wipe-and-repopulate), not additive.
    await seedDatabase();
    expect(await User.countDocuments()).toBe(9);
  });
});
