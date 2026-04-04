import { Role } from '@prisma/client';
import { JwtClaims } from '../shared/security/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: Role;
        clientName: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      auth?: JwtClaims;
    }
  }
}