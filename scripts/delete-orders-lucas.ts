import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const displayIds = [1030, 1031, 1032];
  console.log(`Iniciando exclusão dos pedidos: ${displayIds.join(', ')}...`);

  for (const displayId of displayIds) {
    try {
      const order = await prisma.order.findUnique({
        where: { displayId },
        include: { items: true, tickets: true }
      });

      if (!order) {
        console.log(`[-] Pedido ${displayId} não encontrado.`);
        continue;
      }

      console.log(`[!] Excluindo Pedido ${displayId} (ID: ${order.id})...`);

      // 1. Excluir Evidências de Tickets relacionados
      for (const ticket of order.tickets) {
        await prisma.ticketEvidence.deleteMany({
          where: { ticketId: ticket.id }
        });
      }

      // 2. Excluir Tickets relacionados
      await prisma.ticket.deleteMany({
        where: { orderId: order.id }
      });

      // 3. Excluir Itens do Pedido
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      });

      // 4. Excluir o Pedido
      await prisma.order.delete({
        where: { id: order.id }
      });

      console.log(`[✓] Pedido ${displayId} excluído com sucesso.`);
    } catch (err: any) {
      console.error(`[X] Erro ao excluir pedido ${displayId}:`, err.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
