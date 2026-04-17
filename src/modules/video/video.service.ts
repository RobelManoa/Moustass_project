import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { env } from '../../config/env';
import { prisma } from '../../infrastructure/prisma';
import { badRequest, forbidden, notFound } from '../../shared/http-errors';
import { recordAudit } from '../audit/audit.service';
import { buildMessageManifest, sha256, signManifest, verifyManifest, type MessageManifest } from '../crypto/crypto.service';
import { JwtClaims } from '../../shared/security/jwt';

type MessageListParams = {
  box: 'all' | 'sent' | 'inbox';
  q?: string;
  page: number;
  perPage: number;
  recipientId?: string;
  senderId?: string;
};

function toParticipant(user: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN' } | null) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    role: user.role,
  };
}

function toMessageListItem(
  actor: JwtClaims,
  message: {
    id: string;
    ownerId: string;
    recipientId: string | null;
    title: string;
    description: string | null;
    originalFileName: string;
    mimeType: string;
    mediaSha256: string;
    mediaSignature: string;
    manifestJson: unknown;
    createdAt: Date;
    updatedAt: Date;
    owner: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN' };
    recipient: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN' } | null;
  },
) {
  return {
    id: message.id,
    ownerId: message.ownerId,
    recipientId: message.recipientId,
    title: message.title,
    description: message.description,
    originalFileName: message.originalFileName,
    mimeType: message.mimeType,
    mediaSha256: message.mediaSha256,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    direction:
      actor.userId === message.ownerId
        ? 'sent'
        : actor.userId === message.recipientId
          ? 'inbox'
          : 'shared',
    sender: toParticipant(message.owner),
    recipient: toParticipant(message.recipient),
    security: {
      signaturePresent: Boolean(message.mediaSignature),
      manifestPreview: message.manifestJson,
    },
  };
}

async function findAuthorizedMessage(id: string, actor: JwtClaims) {
  const message = await prisma.videoMessage.findUnique({
    where: { id },
    include: {
      owner: true,
      recipient: true,
    },
  });

  if (!message || message.deletedAt) {
    throw notFound('Message introuvable ou supprimé');
  }

  const isActorSender = message.ownerId === actor.userId;
  const isActorRecipient = message.recipientId === actor.userId;
  const isAdmin = actor.role === 'ADMIN';

  if (!isActorSender && !isActorRecipient && !isAdmin) {
    throw forbidden('Accès refusé');
  }

  return message;
}

function getStorageRoot() {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

function sanitizeFileName(fileName: string) {
  return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadMessage(input: {
  actor: JwtClaims;
  file: Express.Multer.File;
  recipientId: string;
  title: string;
  description?: string;
}) {
  if (!input.file) throw badRequest('Fichier vidéo manquant');
  if (!input.file.mimetype.startsWith('video/')) {
    throw badRequest('Le media doit etre une video');
  }

  const storageRoot = getStorageRoot();
  await mkdir(storageRoot, { recursive: true });

  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
  });

  if (!recipient) {
    throw notFound('Destinataire introuvable');
  }

  if (recipient.id === input.actor.userId) {
    throw badRequest('Vous ne pouvez pas vous envoyer un message a vous-meme');
  }

  const messageId = randomUUID();
  const safeFileName = sanitizeFileName(input.file.originalname);
  const storagePath = path.join(storageRoot, `${messageId}-${safeFileName}`);

  const mediaSha256 = sha256(input.file.buffer);

  const manifest = buildMessageManifest({
  id: messageId,
  clientName: env.CLIENT_NAME,
  ownerId: input.actor.userId,
  recipientId: recipient.id,
  title: input.title,
  description: input.description ?? null,
  originalFileName: input.file.originalname,
  mimeType: input.file.mimetype,
  size: input.file.size,
  mediaSha256,
  recordingDurationSeconds: 5,
  });

  const mediaSignature = signManifest(manifest);

  await writeFile(storagePath, input.file.buffer);

  const message = await prisma.videoMessage.create({
    data: {
      id: messageId,
      ownerId: input.actor.userId,
      recipientId: recipient.id,
      title: input.title,
      description: input.description,
      originalFileName: input.file.originalname,
      mimeType: input.file.mimetype,
      storagePath,
      mediaSha256,
      mediaSignature,
      manifestJson: manifest as any,
    },
  });

  await recordAudit({
    actorId: input.actor.userId,
    action: 'VIDEO_UPLOADED',
    resource: 'video_message',
    resourceId: message.id,
    metadata: {
      title: input.title,
      mediaSha256,
      size: input.file.size,
      recipientId: recipient.id,
      recordingDurationSeconds: 5,
    },
  });

  return prisma.videoMessage.findUniqueOrThrow({
    where: { id: message.id },
    include: {
      owner: true,
      recipient: true,
    },
  }).then((createdMessage) => toMessageListItem(input.actor, createdMessage as any));
}

export async function listMessageRecipients(actor: JwtClaims) {
  const users = await prisma.user.findMany({
    where: {
      id: {
        not: actor.userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return users.map((user) => toParticipant(user as any));
}

export async function listMessages(actor: JwtClaims, params: MessageListParams) {
  const accessWhere =
    params.box === 'sent'
      ? { ownerId: actor.userId }
      : params.box === 'inbox'
        ? { recipientId: actor.userId }
        : actor.role === 'ADMIN'
          ? {}
          : {
              OR: [{ ownerId: actor.userId }, { recipientId: actor.userId }],
            };

  const filters = [
    { deletedAt: null },
    accessWhere,
    params.q
      ? {
          OR: [
            { title: { contains: params.q } },
            { description: { contains: params.q } },
            { originalFileName: { contains: params.q } },
            { owner: { email: { contains: params.q } } },
            { owner: { name: { contains: params.q } } },
            { recipient: { email: { contains: params.q } } },
            { recipient: { name: { contains: params.q } } },
          ],
        }
      : undefined,
    params.senderId ? { ownerId: params.senderId } : undefined,
    params.recipientId ? { recipientId: params.recipientId } : undefined,
  ].filter(Boolean);

  const where = { AND: filters } as any;

  const [messages, total] = await Promise.all([
    prisma.videoMessage.findMany({
      where,
      include: {
        owner: true,
        recipient: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    }),
    prisma.videoMessage.count({ where }),
  ]);

  return {
    messages: messages.map((message) => toMessageListItem(actor, message as any)),
    page: params.page,
    perPage: params.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.perPage)),
  };
}

export async function getMessageDetails(id: string, actor: JwtClaims) {
  const message = await findAuthorizedMessage(id, actor);

  const manifest = message.manifestJson as unknown as MessageManifest;
  const signatureValid = verifyManifest(manifest, message.mediaSignature);

  return {
    ...toMessageListItem(actor, message as any),
    manifest,
    mediaSignature: message.mediaSignature,
    signatureValid,
    canDelete: actor.role === 'ADMIN' || actor.userId === message.ownerId,
  };
}

export async function openMessageStream(id: string, actor: JwtClaims) {
  const message = await findAuthorizedMessage(id, actor);

  const manifest = message.manifestJson as unknown as MessageManifest;
  if (!verifyManifest(manifest, message.mediaSignature)) {
    throw badRequest('Signature invalide – intégrité compromise');
  }

  await recordAudit({
    actorId: actor.userId,
    action: 'VIDEO_READ',
    resource: 'video_message',
    resourceId: message.id,
  });

  return message;
}

export async function removeMessage(id: string, actor: JwtClaims) {
  const message = await findAuthorizedMessage(id, actor);

  if (message.ownerId !== actor.userId && actor.role !== 'ADMIN') {
    throw forbidden('Accès refusé');
  }

  await unlink(message.storagePath).catch(() => undefined);

  await prisma.videoMessage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await recordAudit({
    actorId: actor.userId,
    action: 'VIDEO_DELETED',
    resource: 'video_message',
    resourceId: id,
  });

  return { deleted: true };
}

export function createMessageReadStream(storagePath: string) {
  return createReadStream(storagePath);
}
