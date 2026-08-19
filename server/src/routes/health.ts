import { ROLES } from '@audit-tool/shared';
import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    supportedRoles: ROLES,
  });
});
