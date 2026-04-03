import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});