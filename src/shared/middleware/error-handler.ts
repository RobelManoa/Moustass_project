import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError, notFound } from '../http-errors';

function handlePrismaError(error: unknown, response: Parameters<ErrorRequestHandler>[2]) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(', ')
        : String(error.meta?.target ?? 'champ unique');

      response.status(409).json({
        error: `Conflit de donnees: ${target} deja utilise`,
      });
      return true;
    }

    if (error.code === 'P2025') {
      response.status(404).json({
        error: 'Ressource introuvable',
      });
      return true;
    }

    if (error.code === 'P2000') {
      response.status(400).json({
        error: 'Valeur trop longue pour un des champs',
      });
      return true;
    }

    if (error.code === 'P2011') {
      response.status(400).json({
        error: 'Un champ obligatoire est manquant',
      });
      return true;
    }

    if (error.code === 'P2003') {
      response.status(409).json({
        error: 'Contrainte relationnelle invalide',
      });
      return true;
    }

    console.error('[PrismaKnownRequestError]', {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });

    response.status(400).json({
      error: `Erreur base de donnees (${error.code})`,
    });
    return true;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    response.status(400).json({
      error: 'Donnees invalides',
    });
    return true;
  }

  return false;
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(notFound('Route introuvable'));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation error',
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  if (handlePrismaError(error, response)) {
    return;
  }

  console.error('[UnhandledError]', error);

  response.status(500).json({
    error: 'Internal Server Error',
  });
};