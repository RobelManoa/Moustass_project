import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../infrastructure/prisma';
import { unauthorized } from '../../shared/http-errors';
import { signAuthToken } from '../../shared/security/jwt';
import { toPublicUser } from '../user/user.service';

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw unauthorized('Identifiants invalides');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw unauthorized('Identifiants invalides');
  }

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    clientName: env.CLIENT_NAME,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw unauthorized('Utilisateur introuvable');
  }

  return toPublicUser(user);
}