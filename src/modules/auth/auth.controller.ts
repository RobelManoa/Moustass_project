import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as authService from './auth.service';

export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body);
  response.json(result);
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  // Protection explicite contre le cas où auth n'est pas défini
  if (!request.auth?.userId) {
    throw new Error('Authentication required');
  }

  const user = await authService.me(request.auth.userId);
  response.json({ user });
});