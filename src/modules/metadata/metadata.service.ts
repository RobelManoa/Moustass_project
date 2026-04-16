import { prisma } from '../../infrastructure/prisma';
import { notFound } from '../../shared/http-errors';

export async function listLicenses() {
  return prisma.license.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLicense(input: {
  clientName: string;
  logoUrl?: string;
  email: string;
  phone?: string;
  serialNumber: string;
  maxUsers: number;
  expiresAt: string;
}) {
  return prisma.license.create({
    data: {
      clientName: input.clientName,
      logoUrl: input.logoUrl,
      email: input.email,
      phone: input.phone,
      serialNumber: input.serialNumber,
      maxUsers: input.maxUsers,
      expiresAt: new Date(input.expiresAt),
    },
  });
}

export async function updateLicense(
  id: string,
  input: {
    clientName?: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
    serialNumber?: string;
    maxUsers?: number;
    expiresAt?: string;
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
      logoUrl: input.logoUrl,
      email: input.email,
      phone: input.phone,
      serialNumber: input.serialNumber,
      maxUsers: input.maxUsers,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
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