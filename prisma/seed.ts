import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
      name: env.BOOTSTRAP_ADMIN_NAME,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      name: env.BOOTSTRAP_ADMIN_NAME,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });