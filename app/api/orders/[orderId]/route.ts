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

    // Hack para Windows: busca barcodes e pickedQuantity via SQL puro para evitar travas de tipo Prisma
    const [barcodes, pickedQuantities] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT "id", "barcode" FROM "Product"`),
      prisma.$queryRaw<any[]>`SELECT "id", "pickedQuantity" FROM "OrderItem" WHERE "orderId" = ${orderId}`
    ]);

    const formattedItems = order.items.map((item: any) => {
      const b = barcodes.find((b: any) => b.id === item.productId);
      const pq = pickedQuantities.find((p: any) => p.id === item.id);
      
      return {
        ...item,
        pickedQuantity: pq ? (pq.pickedQuantity || 0) : 0,
        product: item.product ? {
          ...item.product,
          barcode: b ? b.barcode : null
        } : null
      };
    });

    const formattedOrder = {
      ...order,
      items: formattedItems
    };

    return NextResponse.json(formattedOrder);
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
    const { status, items, notes, discount } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (existingOrder.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Não é possível editar pedidos já concluídos' }, { status: 400 });
    }

    if (existingOrder.status === 'DISPATCHED') {
      if (status !== 'DELIVERED') {
        return NextResponse.json({ error: 'Pedidos despachados só podem ser concluídos' }, { status: 400 });
      }
      if (items !== undefined || (discount !== undefined && Number(discount) !== existingOrder.discount) || notes !== undefined) {
        return NextResponse.json({ error: 'Não é possível editar itens de pedidos já despachados' }, { status: 400 });
      }
    }

    const finalDiscount = discount !== undefined ? Number(discount) : existingOrder.discount;
    const orderItems = items || existingOrder.items;
    const subtotal = orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const finalTotal = Math.max(0, subtotal + (existingOrder.shipping || 0) + (existingOrder.tax || 0) - finalDiscount);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus || undefined,
        notes: notes !== undefined ? notes : undefined,
        discount: finalDiscount,
        totalPrice: finalTotal,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
        items: items ? {
          deleteMany: {},
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        } : undefined
      } as any,
    });
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Patch Order Error:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar pedido', details: error.message }, { status: 500 });
  }
}
