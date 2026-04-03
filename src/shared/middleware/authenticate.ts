import type { RequestHandler } from 'express';
import { forbidden, unauthorized } from '../http-errors';
import { verifyAuthToken } from '../security/jwt';

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(unauthorized('Bearer token manquant'));
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    request.auth = verifyAuthToken(token);
    next();
  } catch {
    next(unauthorized('Jeton invalide'));
  }
};

export function requireRole(...roles: Array<'USER' | 'ADMIN'>): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(unauthorized());
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(forbidden('Ressource interdite pour ce rôle'));
      return;
    }

    next();
  };
}