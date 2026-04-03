import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import licenseRoutes from './modules/license/license.routes';
import userRoutes from './modules/user/user.routes';
import videoRoutes from './modules/video/video.routes';
import { apiRateLimiter } from './shared/middleware/rate-limit';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/info', (_request, response) => {
  response.json({
    client: env.CLIENT_NAME,
    version: env.APP_VERSION,
  });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', videoRoutes);
app.use('/license', licenseRoutes);

app.use(notFoundHandler);
app.use(errorHandler);