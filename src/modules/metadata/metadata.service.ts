import { prisma } from '../../infrastructure/prisma';

export async function getMessageById(id: string) {
  return prisma.videoMessage.findUnique({
    where: { id },
  });
}

export async function getMessageByIdForActor(id: string, actorId: string, isAdmin = false) {
  const message = await getMessageById(id);

  if (!message) {
    return null;
  }

  if (isAdmin || message.ownerId === actorId) {
    return message;
  }

  return null;
}

export async function listMessagesForActor(actorId: string, isAdmin = false) {
  return prisma.videoMessage.findMany({
    where: isAdmin ? {} : { ownerId: actorId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}