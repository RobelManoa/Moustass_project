import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { badRequest } from '../../shared/http-errors';
import { createMessageReadStream, openMessageStream, removeMessage, uploadMessage } from './video.service';

function getIdParam(request: Request) {
  const { id } = request.params;
  if (Array.isArray(id) || !id) {
    throw badRequest('Parametre id invalide');
  }
  return id;
}

export const upload = asyncHandler(async (request: Request, response: Response) => {
  if (!request.file) {
    throw badRequest('Fichier vidéo manquant');
  }

  const title = typeof request.body.title === 'string' ? request.body.title : '';
  const description = typeof request.body.description === 'string' ? request.body.description : undefined;

  const message = await uploadMessage({
    actor: request.auth!,
    file: request.file,
    title,
    description,
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