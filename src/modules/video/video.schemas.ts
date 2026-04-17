import { z } from 'zod';

export const videoUploadSchema = z.object({
  recipientId: z.string().min(1, 'Le destinataire est obligatoire'),
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères').max(255),
  description: z.string().max(2000).optional(),
});

export const videoListQuerySchema = z.object({
  box: z.enum(['all', 'sent', 'inbox']).optional().default('all'),
  q: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(24).optional().default(6),
  recipientId: z.string().optional(),
  senderId: z.string().optional(),
});
