import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const item = await prisma.orderItem.findFirst({
      select: { id: true, orderId: true }
    });
    console.log('Valid Item Found:', item);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
