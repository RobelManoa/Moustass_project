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
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  expiresAt?: string | null;
  payloadJson?: Record<string, unknown>;
}) {
  return prisma.license.create({
    data: {
      clientName: input.clientName,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      payloadJson: input.payloadJson as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function updateLicense(
  id: string,
  input: {
    clientName?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
    expiresAt?: string | null;
    payloadJson?: Record<string, unknown>;
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
      status: input.status,
      expiresAt: input.expiresAt === undefined ? undefined : input.expiresAt ? new Date(input.expiresAt) : null,
      payloadJson: input.payloadJson as Prisma.InputJsonValue | undefined,
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