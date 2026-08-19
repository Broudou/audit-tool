import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('GET /api/v1/health', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.SESSION_SECRET = 'test-session-secret-value-32-chars-min';
    process.env.CSRF_SECRET = 'test-csrf-secret-value-32-characters-min';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('reports ok status, a connected database, and the supported roles', async () => {
    const { createApp } = await import('../../src/app.js');
    const app = createApp();

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
    expect(response.body.supportedRoles).toEqual(['admin', 'manager', 'auditor']);
  });
});
