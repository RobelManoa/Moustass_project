import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';

import authRoutes from './modules/auth/auth.routes';
// Import des autres routes (on les chargera conditionnellement)
import licenseRoutes from './modules/license/license.routes';
import userRoutes from './modules/user/user.routes';
import videoRoutes from './modules/video/video.routes';

import { apiRateLimiter } from './shared/middleware/rate-limit';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { authenticate, requireRole } from './shared/middleware/authenticate';

export const app = express();

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy:
      env.NODE_ENV === 'development' ? { policy: 'cross-origin' } : { policy: 'same-origin' },
  })
);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use(apiRateLimiter);

// Endpoints publics (toujours disponibles)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/info', (_req, res) => {
  res.json({
    client: env.CLIENT_NAME,
    version: env.APP_VERSION,
  });
});

// ====================== Routes conditionnelles ======================
const enabledModules = (env.ENABLED_MODULES || 'auth,user,video,license')
  .split(',')
  .map((m: string) => m.trim().toLowerCase());

// Auth (toujours activé par défaut)
if (enabledModules.includes('auth')) {
  app.use('/auth', authRoutes);
}

// Users (protégé ADMIN)
if (enabledModules.includes('user')) {
  app.use('/users', authenticate, requireRole('ADMIN'), userRoutes);
}

// Messages / Video
if (enabledModules.includes('video') || enabledModules.includes('messages')) {
  app.use('/messages', authenticate, videoRoutes);
}

// License (protégé ADMIN)
if (enabledModules.includes('license')) {
  app.use('/license', authenticate, requireRole('ADMIN'), licenseRoutes);
}

// Gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);