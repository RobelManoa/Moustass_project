import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtClaims {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  clientName: string;
}

export function signAuthToken(claims: JwtClaims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    audience: env.JWT_AUDIENCE,
    expiresIn: '8h',
    issuer: env.JWT_ISSUER,
    subject: claims.userId,
  });
}

export function verifyAuthToken(token: string): JwtClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    audience: env.JWT_AUDIENCE,
    issuer: env.JWT_ISSUER,
  });

  if (typeof decoded === 'string') {
    throw new TypeError('Invalid token payload');
  }

  return {
    userId: String(decoded.userId),
    email: String(decoded.email),
    role: decoded.role as JwtClaims['role'],
    clientName: String(decoded.clientName),
  };
}