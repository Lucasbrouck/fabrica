import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, reason, description, evidence, orderId } = body;

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        type: type || 'GENERAL',
        reason,
        description,
        orderId: orderId || null,
        status: 'OPEN',
        evidences: evidence ? {
          create: {
            url: evidence
          }
        } : undefined
      },
      include: {
        evidences: true,
        user: { select: { name: true, email: true } },
        order: { select: { displayId: true } }
      }
    });

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error("Create Ticket Error:", error);
    return NextResponse.json({ error: 'Erro ao criar chamado', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const tickets = await prisma.ticket.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        evidences: true,
        user: { select: { name: true, email: true } },
        order: { select: { displayId: true } }
      }
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("Get Tickets Error:", error);
    return NextResponse.json({ error: 'Erro ao buscar chamados', details: error.message }, { status: 500 });
  }
}
