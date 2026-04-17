import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma';
import { notFound } from '../../shared/http-errors';

export async function listLicenses() {
  return prisma.license.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLicense(input: {
  clientName: string;
  serialNumber: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  maxUsers?: number;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  expiresAt?: string | null;
}) {
  return prisma.license.create({
    data: {
      clientName: input.clientName,
      serialNumber: input.serialNumber,
      email: input.email || null,
      phone: input.phone || null,
      logoUrl: input.logoUrl || null,
      status: input.status,
      maxUsers: input.maxUsers,
      metadata: input.metadata,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function updateLicense(
  id: string,
  input: {
    clientName?: string;
    serialNumber?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
    maxUsers?: number;
    metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    expiresAt?: string | null;
  },
) {
  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) {
    throw notFound('Licence introuvable');
  }

  return prisma.license.update({
    where: { id },
    data: {
      clientName: input.clientName,
      serialNumber: input.serialNumber,
      email: input.email === '' ? null : input.email,
      phone: input.phone === '' ? null : input.phone,
      logoUrl: input.logoUrl === '' ? null : input.logoUrl,
      status: input.status,
      maxUsers: input.maxUsers,
      metadata: input.metadata,
      expiresAt:
        input.expiresAt === null
          ? null
          : input.expiresAt
            ? new Date(input.expiresAt)
            : undefined,
    },
  });
}

export async function deleteLicense(id: string) {
  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) {
    throw notFound('Licence introuvable');
  }

  await prisma.license.delete({ where: { id } });
  return { deleted: true };
}
