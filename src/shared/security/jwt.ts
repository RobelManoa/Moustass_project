import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtClaims {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  clientName: string;
}

export function signAuthToken(claims: JwtClaims): string {
  const secretOrPrivateKey = env.JWT_PRIVATE_KEY || env.JWT_SECRET;

  if (!secretOrPrivateKey) {
    throw new Error('JWT signing key is not configured');
  }

  return jwt.sign(claims, secretOrPrivateKey, {
    algorithm: env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256',
    audience: env.JWT_AUDIENCE,
    expiresIn: '8h',
    issuer: env.JWT_ISSUER,
    subject: claims.userId,
    // Optionnel mais recommandé pour traçabilité
    jwtid: `moustass-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}

export function verifyAuthToken(token: string): JwtClaims {
  const secretOrPublicKey = env.JWT_PUBLIC_KEY || env.JWT_SECRET;

  if (!secretOrPublicKey) {
    throw new Error('JWT verification key is not configured');
  }

  const decoded = jwt.verify(token, secretOrPublicKey, {
    algorithms: [env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256'], // Whitelist explicite → sécurité +
    audience: env.JWT_AUDIENCE,
    issuer: env.JWT_ISSUER,
  });

  if (typeof decoded === 'string' || !decoded.userId) {
    throw new Error('Invalid token payload');
  }

  return {
    userId: String(decoded.userId),
    email: String(decoded.email),
    role: decoded.role as JwtClaims['role'],
    clientName: String(decoded.clientName),
  };
}