import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  try {
    const { status } = await request.json();

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error("Update Ticket Error:", error);
    return NextResponse.json({ error: 'Erro ao atualizar chamado', details: error.message }, { status: 500 });
  }
}
