import type { RequestHandler } from 'express';
import { forbidden, unauthorized } from '../http-errors';
import { verifyAuthToken } from '../security/jwt';

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(unauthorized('Bearer token manquant'));
  }

  const token = authorization.slice(7); // plus clair que .slice('Bearer '.length)

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch (err: any) {
    // Tu peux logger l’erreur ici si tu as un logger centralisé
    next(unauthorized(err.message || 'Jeton invalide ou expiré'));
  }
};

export function requireRole(...roles: Array<'USER' | 'ADMIN'>): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(unauthorized('Authentification requise'));
    }

    if (!roles.includes(req.auth.role)) {
      return next(forbidden(`Rôle insuffisant. Requis : ${roles.join(' ou ')}`));
    }

    next();
  };
}