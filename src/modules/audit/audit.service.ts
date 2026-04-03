import type { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma';

export async function recordAudit(input: {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.audit.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
    },
  });
}