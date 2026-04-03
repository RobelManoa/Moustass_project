import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { badRequest } from '../../shared/http-errors';
import * as licenseService from './license.service';

function getIdParam(request: Request) {
  const { id } = request.params;
  if (Array.isArray(id) || !id) {
    throw badRequest('Parametre id invalide');
  }
  return id;
}

export const listLicenses = asyncHandler(async (_request: Request, response: Response) => {
  const licenses = await licenseService.listLicenses();
  response.json({ licenses });
});

export const createLicense = asyncHandler(async (request: Request, response: Response) => {
  const license = await licenseService.createLicense(request.body);
  response.status(201).json({ license });
});

export const updateLicense = asyncHandler(async (request: Request, response: Response) => {
  const license = await licenseService.updateLicense(getIdParam(request), request.body);
  response.json({ license });
});

export const deleteLicense = asyncHandler(async (request: Request, response: Response) => {
  const result = await licenseService.deleteLicense(getIdParam(request));
  response.json(result);
});