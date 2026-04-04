import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: '.env.example', override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_NAME: z.string().min(1).default('Client A'),
  APP_VERSION: z.string().min(1).default('1.0.0'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1).default('change-me-in-dev'),
  JWT_ISSUER: z.string().min(1).default('moustass-backend'),
  JWT_AUDIENCE: z.string().min(1).default('moustass-client'),
  UPLOAD_DIR: z.string().min(1).default('storage/messages'),
  OIDC_ISSUER: z.string().optional().default(''),
  OIDC_CLIENT_ID: z.string().optional().default(''),
  OIDC_CLIENT_SECRET: z.string().optional().default(''),
  CRYPTO_PRIVATE_KEY_PEM: z.string().optional().default(''),
  CRYPTO_PUBLIC_KEY_PEM: z.string().optional().default(''),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional().default('admin@client.local'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional().default('ChangeMe123!'),
  BOOTSTRAP_ADMIN_NAME: z.string().min(1).optional().default('Admin'),
});

export const env = envSchema.parse(process.env);