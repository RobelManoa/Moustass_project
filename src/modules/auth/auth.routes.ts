import { Router } from 'express';
import { loginSchema } from './auth.schemas';
import { login, me, oidcCallback, oidcLogin } from './auth.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validateBody } from '../../shared/middleware/validate';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, me);
router.get('/oidc/login', oidcLogin);
router.get('/oidc/callback', oidcCallback);

export default router;