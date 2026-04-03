import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthContext {
      userId: string;
      email: string;
      role: Role;
      clientName: string;
    }

    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};