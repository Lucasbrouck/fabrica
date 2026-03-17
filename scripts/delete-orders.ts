import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_USER_ID = 'cmmsfevmn000021slvlxd8q3r';

async function main() {
  try {
    console.log(`Starting deletion of orders for userId: ${TARGET_USER_ID}`);

    // 1. Fetch all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId: TARGET_USER_ID },
      select: { id: true }
    });

    const orderIds = orders.map(o => o.id);
    console.log(`Found ${orderIds.length} orders for this user.`);

    if (orderIds.length === 0) {
      console.log('No orders to delete.');
      return;
    }

    // 2. Fetch related tickets to delete evidence
    const tickets = await prisma.ticket.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true }
    });
    const ticketIds = tickets.map(t => t.id);
    console.log(`Found ${ticketIds.length} related tickets.`);

    // Deletion order to avoid FK constraints
    await prisma.$transaction(async (tx) => {
      if (ticketIds.length > 0) {
         console.log('Deleting ticket evidences...');
         await tx.ticketEvidence.deleteMany({
           where: { ticketId: { in: ticketIds } }
         });

         console.log('Deleting tickets...');
         await tx.ticket.deleteMany({
           where: { id: { in: ticketIds } }
         });
      }

      console.log('Deleting order items...');
      await tx.orderItem.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      console.log('Deleting orders...');
      const deletedOrders = await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      });

      console.log(`Successfully deleted ${deletedOrders.count} orders.`);
    });

  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
