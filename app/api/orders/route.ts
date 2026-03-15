import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use raw SQL to ensure new fields are included even if Prisma client is outdated
    const orders = await prisma.$queryRaw`
      SELECT 
        o.*,
        u.name as "userName",
        u.email as "userEmail"
      FROM "Order" o
      JOIN "User" u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
    `;

    // Fetch items separately for each order (simpler than complex raw join for nested items)
    const ordersWithItems = await Promise.all((orders as any[]).map(async (order) => {
      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: { product: true }
      });
      
      return {
        ...order,
        user: { name: order.userName, email: order.userEmail },
        items
      };
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error: any) {
    console.error("GET Orders Error:", error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, totalPrice, discount } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Dados do pedido inválidos (userId ou items ausentes)' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: `Usuário com ID ${userId} não encontrado no banco de dados.` },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        discount: discount || 0,
        status: OrderStatus.PLACED,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json(
      { error: 'Erro interno ao criar pedido', details: error.message },
      { status: 500 }
    );
  }
}
