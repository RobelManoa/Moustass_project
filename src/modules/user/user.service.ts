import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma';
import { badRequest, notFound } from '../../shared/http-errors';

export function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return users.map(toPublicUser);
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw badRequest('Un utilisateur existe déjà avec cet email');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    },
  });

  return toPublicUser(user);
}

export async function updateUser(id: string, input: { name?: string; password?: string; role?: Role }) {
  const current = await prisma.user.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Utilisateur introuvable');
  }

  const data: Prisma.UserUpdateInput = {};

  if (input.name) {
    data.name = input.name;
  }

  if (input.role) {
    data.role = input.role;
  }

  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 12);
  }

  const user = await prisma.user.update({ where: { id }, data });
  return toPublicUser(user);
}

export async function deleteUser(id: string) {
  const current = await prisma.user.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Utilisateur introuvable');
  }

  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}