import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Get Order Error:", error);
    return NextResponse.json({ error: 'Erro ao buscar pedido', details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const body = await request.json();
    const { status, items, notes } = body;
    
    // If only status is provided
    if (status && !items) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: status as OrderStatus,
          notes: notes !== undefined ? notes : undefined,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined
        } as any,
      });
      return NextResponse.json(order);
    }

    // If items are provided (Editing)
    if (items) {
      // 1. Delete existing items
      await prisma.orderItem.deleteMany({
        where: { orderId: orderId },
      });

      // 2. Create new items and calculate total
      const newTotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          totalPrice: newTotal,
          status: status as OrderStatus || undefined,
          notes: notes !== undefined ? notes : undefined,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        } as any,
        include: { items: { include: { product: true } }, user: { select: { name: true } } },
      });
      
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: 'Nenhum dado fornecido para atualização' }, { status: 400 });
  } catch (error: any) {
    console.error("Patch Order Error:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar pedido', details: error.message }, { status: 500 });
  }
}
