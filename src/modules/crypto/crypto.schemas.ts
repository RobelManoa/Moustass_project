import { z } from 'zod';

export const messageManifestSchema = z.object({
  id: z.string().uuid(),
  clientName: z.string().min(1),
  ownerId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().nullable().optional(),
  originalFileName: z.string().min(1),
  mimeType: z.string().regex(/^video\//, 'Le type MIME doit être une vidéo'),
  size: z.number().int().positive(),
  mediaSha256: z.string().length(64, 'Le hash SHA-256 doit faire 64 caractères'),
  uploadedAt: z.string().datetime(),
});

export const signManifestSchema = z.object({
  manifest: messageManifestSchema,
});

export type MessageManifestInput = z.infer<typeof messageManifestSchema>;