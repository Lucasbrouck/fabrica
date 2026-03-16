import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.findFirst({
      where: { name: { contains: 'Frango', mode: 'insensitive' } }
    });
    
    console.log('Product Found:', product);
  } catch (err) {
    console.error('Error fetching Frango product:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
