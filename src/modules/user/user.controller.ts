import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { badRequest } from '../../shared/http-errors';
import * as userService from './user.service';

function getIdParam(request: Request) {
  const { id } = request.params;
  if (Array.isArray(id) || !id) {
    throw badRequest('Parametre id invalide');
  }
  return id;
}

export const listUsers = asyncHandler(async (_request: Request, response: Response) => {
  const users = await userService.listUsers();
  response.json({ users });
});

export const createUser = asyncHandler(async (request: Request, response: Response) => {
  const user = await userService.createUser(request.body);
  response.status(201).json({ user });
});

export const updateUser = asyncHandler(async (request: Request, response: Response) => {
  const user = await userService.updateUser(getIdParam(request), request.body);
  response.json({ user });
});

export const deleteUser = asyncHandler(async (request: Request, response: Response) => {
  const result = await userService.deleteUser(getIdParam(request));
  response.json(result);
});