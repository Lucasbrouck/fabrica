import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREFIX_MAP: Record<string, string> = {
  "Feijão": "FJ",
  Carne: "CR",
  Sour: "SR",
  Porco: "PR",
  Arroz: "AR",
  Frango: "FR",
  Pepper: "PP",
  "Salsa verde": "SV",
  Abacaxi: "AB",
};

async function main() {
  try {
    console.log('Seeding barcodes for products...');
    
    // Fetch all products
    const products = await prisma.product.findMany();
    
    for (const [name, prefix] of Object.entries(PREFIX_MAP)) {
      // Find matching products by name (case-insensitive)
      const matches = products.filter(p => 
        p.name.toLowerCase().includes(name.toLowerCase())
      );
      
      console.log(`Found ${matches.length} matches for "${name}"`);
      
      for (const product of matches) {
        await prisma.product.update({
          where: { id: product.id },
          data: { barcode: prefix } as any
        });
        console.log(`Updated "${product.name}" with barcode "${prefix}"`);
      }
    }
    
    console.log('Seeding barcodes completed successfully!');
  } catch (err) {
    console.error('Error seeding barcodes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
