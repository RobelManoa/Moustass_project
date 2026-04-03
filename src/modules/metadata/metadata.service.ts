import { prisma } from '../../infrastructure/prisma';

export function getMessageById(id: string) {
  return prisma.videoMessage.findUnique({
    where: { id },
    include: { owner: true },
  });
}

export function listMessagesForActor(actorId: string, isAdmin: boolean) {
  return prisma.videoMessage.findMany({
    where: isAdmin ? {} : { ownerId: actorId },
    orderBy: { createdAt: 'desc' },
    include: { owner: true },
  });
}