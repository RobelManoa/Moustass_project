import { z } from 'zod';

export const licenseCreateSchema = z.object({
  clientName: z.string().min(1),
  serialNumber: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1).optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  maxUsers: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).default('ACTIVE'),
  expiresAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

export const licenseUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  serialNumber: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1).optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  maxUsers: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).optional(),
});
