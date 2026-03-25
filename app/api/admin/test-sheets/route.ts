import { NextResponse } from 'next/server';
import { appendRowToSheet } from '@/lib/google-sheets';

export async function POST() {
  try {
    await appendRowToSheet({
      orderId: "TEST-123",
      customerName: "USUÁRIO TESTE",
      totalPrice: 99.99,
      paymentUrl: "https://teste.com",
      dueDate: "2026-01-01",
      status: "TESTE"
    });
    return NextResponse.json({ success: true, message: "Linha de teste enviada para o Google Sheets" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
