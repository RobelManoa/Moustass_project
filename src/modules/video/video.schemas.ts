import { z } from 'zod';

export const videoUploadSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères').max(255),
  description: z.string().max(2000).optional(),
});