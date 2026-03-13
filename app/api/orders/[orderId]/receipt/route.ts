import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  
  try {
    const body = await request.json();
    const { signature } = body;

    if (!signature) {
      return NextResponse.json({ error: 'Assinatura é obrigatória' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        signature,
        status: 'DELIVERED',
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Signature Save Error:", error);
    return NextResponse.json({ error: 'Erro ao salvar assinatura', details: error.message }, { status: 500 });
  }
}
