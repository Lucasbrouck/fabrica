import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    console.log(user.id);
  } else {
    // If no user exists, create a default one
    const newUser = await prisma.user.create({
      data: {
        email: 'cliente@teste.com',
        name: 'Cliente de Teste',
        password: 'password123',
        role: 'CUSTOMER'
      }
    });
    console.log(newUser.id);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
