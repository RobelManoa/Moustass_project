// src/shared/types/express.d.ts
import type { JwtClaims } from '../security/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtClaims;
    }
  }
}

// Ce fichier doit être considéré comme un module pour les déclarations globales
export {};