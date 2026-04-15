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
  maxUsers?: number;
  expiresAt: string;        // format ISO string
}) {
  return prisma.license.create({
    data: {
      clientName: input.clientName,
      serialNumber: input.serialNumber,
      email: input.email,
      phone: input.phone,
      logoUrl: input.logoUrl,
      maxUsers: input.maxUsers,
      expiresAt: new Date(input.expiresAt),
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
      serialNumber: input.serialNumber,
      email: input.email,
      phone: input.phone,
      logoUrl: input.logoUrl,
      maxUsers: input.maxUsers,
      // On ne met à jour expiresAt que si une valeur est fournie
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