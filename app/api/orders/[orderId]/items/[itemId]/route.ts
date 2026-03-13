import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string, itemId: string }> }
) {
  const { orderId, itemId } = await params;
  try {
    const { pickedQuantity } = await request.json();

    // Use raw SQL to bypass Prisma Client type issues with new fields
    await prisma.$executeRaw`
      UPDATE "OrderItem" 
      SET "pickedQuantity" = ${pickedQuantity}
      WHERE "id" = ${itemId} AND "orderId" = ${orderId}
    `;

    return NextResponse.json({ success: true, itemId, pickedQuantity });
  } catch (error: any) {
    console.error("Patch Order Item Error:", error);
    return NextResponse.json({ error: 'Erro ao atualizar item do pedido', details: error.message }, { status: 500 });
  }
}
