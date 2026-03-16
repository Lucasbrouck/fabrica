import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding column "barcode" to "Product"...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "barcode" TEXT;
    `);
    console.log('Column "barcode" added successfully to Product!');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
