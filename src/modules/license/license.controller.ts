import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as licenseService from './license.service';

export const listLicenses = asyncHandler(async (_request: Request, response: Response) => {
  const licenses = await licenseService.listLicenses();
  response.json({ licenses });
});

export const createLicense = asyncHandler(async (request: Request, response: Response) => {
  const license = await licenseService.createLicense(request.body);
  response.status(201).json({ license });
});

export const updateLicense = asyncHandler(async (request: Request, response: Response) => {
  const license = await licenseService.updateLicense(request.params.id, request.body);
  response.json({ license });
});

export const deleteLicense = asyncHandler(async (request: Request, response: Response) => {
  const result = await licenseService.deleteLicense(request.params.id);
  response.json(result);
});