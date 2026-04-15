import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { badRequest } from '../../shared/http-errors';
import { videoUploadSchema } from './video.schemas';
import { createMessageReadStream, openMessageStream, removeMessage, uploadMessage } from './video.service';

function getIdParam(request: Request) {
  const { id } = request.params;
  if (!id || Array.isArray(id)) {
    throw badRequest('Paramètre id invalide');
  }
  return id;
}

export const upload = asyncHandler(async (request: Request, response: Response) => {
  if (!request.file) throw badRequest('Fichier vidéo manquant');

  const body = videoUploadSchema.parse(request.body);

  const message = await uploadMessage({
    actor: request.auth!,
    file: request.file,
    title: body.title,
    description: body.description,
  });

  response.status(201).json({ message });
});

export const read = asyncHandler(async (request: Request, response: Response) => {
  const message = await openMessageStream(getIdParam(request), request.auth!);

  response.setHeader('Content-Type', message.mimeType);
  response.setHeader('Content-Disposition', `inline; filename="${message.originalFileName}"`);
  createMessageReadStream(message.storagePath).pipe(response);
});

export const remove = asyncHandler(async (request: Request, response: Response) => {
  const result = await removeMessage(getIdParam(request), request.auth!);
  response.json(result);
});