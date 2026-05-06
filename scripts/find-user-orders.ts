import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = "Lucas Brouck";
  console.log(`Buscando pedidos para: "${searchTerm}"...`);

  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    },
    include: {
      orders: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (users.length === 0) {
    console.log("Nenhum usuário encontrado com esse nome.");
    return;
  }

  users.forEach(user => {
    console.log(`\nUsuário: ${user.name} (ID: ${user.id})`);
    console.log(`E-mail: ${user.email}`);
    console.log(`Total de pedidos: ${user.orders.length}`);
    
    if (user.orders.length > 0) {
      console.log("\nLista de Pedidos:");
      console.log("ID Exibição | Status         | Valor Total | Criado Em");
      console.log("------------------------------------------------------------------");
      user.orders.forEach(order => {
        console.log(`${order.displayId.toString().padEnd(11)} | ${order.status.padEnd(14)} | R$ ${order.totalPrice.toFixed(2).padEnd(10)} | ${order.createdAt.toISOString()}`);
      });
    } else {
      console.log("Este usuário não possui pedidos.");
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
