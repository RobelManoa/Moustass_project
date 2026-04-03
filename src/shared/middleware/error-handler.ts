import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError, notFound } from '../http-errors';

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

  response.status(500).json({
    error: 'Internal Server Error',
  });
};