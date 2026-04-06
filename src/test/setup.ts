import { prisma } from '../infrastructure/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});