import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fabrica.com' },
    update: {},
    create: {
      email: 'admin@fabrica.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create Categories
  const cat1 = await prisma.category.upsert({
    where: { name: 'Hambúrgueres' },
    update: {},
    create: { name: 'Hambúrgueres' },
  })

  const cat2 = await prisma.category.upsert({
    where: { name: 'Bebidas' },
    update: {},
    create: { name: 'Bebidas' },
  })

  // Create Products
  await prisma.product.createMany({
    data: [
      { name: 'X-Burger Prime', price: 28.90, categoryId: cat1.id },
      { name: 'Cheese Bacon Especial', price: 34.50, categoryId: cat1.id },
      { name: 'Coca-Cola 350ml', price: 6.50, categoryId: cat2.id },
      { name: 'Suco de Laranja 400ml', price: 12.00, categoryId: cat2.id },
    ],
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
