import { z } from 'zod';

export const licenseCreateSchema = z.object({
  clientName: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).default('ACTIVE'),
  expiresAt: z.string().datetime().optional().nullable(),
  payloadJson: z.record(z.any()).optional(),
});

export const licenseUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  payloadJson: z.record(z.any()).optional(),
});