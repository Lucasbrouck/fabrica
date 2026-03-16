import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.product.count();
    const products = await prisma.product.findMany({ select: { name: true } });
    
    console.log(`Total Products in Database: ${count}`);
    console.log('Product Names:');
    products.forEach(p => console.log(`- ${p.name}`));
    
    console.log('\nNothing was deleted!');
  } catch (err) {
    console.error('Error counting products:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
