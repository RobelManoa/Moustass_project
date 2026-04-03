import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import { prisma } from '../../infrastructure/prisma';
import { badRequest, forbidden, notFound } from '../../shared/http-errors';
import { recordAudit } from '../audit/audit.service';
import { buildMessageManifest, sha256, signManifest, verifyManifest, type MessageManifest } from '../crypto/crypto.service';
import { getMessageById } from '../metadata/metadata.service';

function getStorageRoot() {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

function sanitizeFileName(fileName: string) {
  return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadMessage(input: {
  actor: Express.AuthContext;
  file: Express.Multer.File;
  title: string;
  description?: string;
}) {
  if (!input.file) {
    throw badRequest('Fichier vidéo manquant');
  }

  const storageRoot = getStorageRoot();
  await mkdir(storageRoot, { recursive: true });

  const messageId = randomUUID();
  const safeFileName = sanitizeFileName(input.file.originalname);
  const storagePath = path.join(storageRoot, `${messageId}-${safeFileName}`);
  const mediaSha256 = sha256(input.file.buffer);

  const manifest = buildMessageManifest({
    id: messageId,
    clientName: env.CLIENT_NAME,
    ownerId: input.actor.userId,
    title: input.title,
    description: input.description ?? null,
    originalFileName: input.file.originalname,
    mimeType: input.file.mimetype,
    size: input.file.size,
    mediaSha256,
    uploadedAt: new Date().toISOString(),
  });

  const mediaSignature = signManifest(manifest);

  await writeFile(storagePath, input.file.buffer);

  const message = await prisma.videoMessage.create({
    data: {
      id: messageId,
      ownerId: input.actor.userId,
      title: input.title,
      description: input.description,
      originalFileName: input.file.originalname,
      mimeType: input.file.mimetype,
      storagePath,
      mediaSha256,
      mediaSignature,
      manifestJson: manifest,
    },
  });

  await recordAudit({
    actorId: input.actor.userId,
    action: 'VIDEO_UPLOADED',
    resource: 'message',
    resourceId: message.id,
    metadata: { title: input.title, mediaSha256 },
  });

  return message;
}

export async function openMessageStream(id: string, actor: Express.AuthContext) {
  const message = await getMessageById(id);

  if (!message || message.deletedAt) {
    throw notFound('Message introuvable');
  }

  if (message.ownerId !== actor.userId && actor.role !== 'ADMIN') {
    throw forbidden('Accès refusé');
  }

  const manifest = message.manifestJson as unknown as MessageManifest;
  const isSignatureValid = verifyManifest(manifest, message.mediaSignature);

  if (!isSignatureValid) {
    throw badRequest('Signature invalide pour ce message');
  }

  return message;
}

export async function removeMessage(id: string, actor: Express.AuthContext) {
  const message = await getMessageById(id);

  if (!message || message.deletedAt) {
    throw notFound('Message introuvable');
  }

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
    resource: 'message',
    resourceId: id,
  });

  return { deleted: true };
}

export function createMessageReadStream(storagePath: string) {
  return createReadStream(storagePath);
}