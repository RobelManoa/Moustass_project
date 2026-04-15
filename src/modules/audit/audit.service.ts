import { prisma } from '../../infrastructure/prisma';

type AuditInput = {
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Fonction principale pour enregistrer un audit
 */
export async function recordAudit(input: AuditInput) {
  return prisma.audit.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

// Fonctions supplémentaires utiles
export async function listAudits(limit = 50) {
  return prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getAuditById(id: string) {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}