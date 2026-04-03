import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../http-errors';

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      next(badRequest('Validation error', parsed.error.flatten()));
      return;
    }

    request.body = parsed.data;
    next();
  };
}