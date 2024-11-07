import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Handle cleanup on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;