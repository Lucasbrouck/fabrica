import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding column "pickedQuantity" to "OrderItem"...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OrderItem" 
      ADD COLUMN IF NOT EXISTS "pickedQuantity" INTEGER DEFAULT 0;
    `);
    console.log('Column added successfully!');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
