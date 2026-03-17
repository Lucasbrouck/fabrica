import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPaymentForOrder } from '@/lib/order-payment';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const result = await createPaymentForOrder(orderId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Asaas Payment Route Error:", error);
    return NextResponse.json({ error: 'Erro ao gerar cobrança no Asaas', details: error.message }, { status: 500 });
  }
}
