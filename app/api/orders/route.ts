import prisma from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pdv-fabrica-premium-secret-key-2026"
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const role = payload.role as string;

    const { searchParams } = request.nextUrl;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam) : null;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Filter by userId if the user is a CUSTOMER (not ADMIN, GESTOR, or SEPARADOR)
    const roleFilter = role === 'CUSTOMER' 
      ? Prisma.sql`AND o."userId" = ${userId}` 
      : Prisma.empty;

    const limitClause = limit !== null 
      ? Prisma.sql`LIMIT ${limit} OFFSET ${offset}` 
      : Prisma.empty;

    // Use raw SQL to ensure new fields are included even if Prisma client is outdated
    const orders = await prisma.$queryRaw`
      SELECT 
        o.*,
        u.name as "userName",
        u.email as "userEmail"
      FROM "Order" o
      JOIN "User" u ON o."userId" = u.id
      WHERE 1=1 ${roleFilter}
      ORDER BY o."createdAt" DESC
      ${limitClause}
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
    if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' || error.name === 'JWTClaimValidationFailed') {
        return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao buscar pedidos', details: error.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, totalPrice, discount, shipping, tax } = body;

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

    // Constants for Day Check
    const daysPt = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const today = new Date();
    const todaySaoPaulo = new Date(today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayStr = daysPt[todaySaoPaulo.getDay()];

    const isOrderDay = userExists.orderDays?.includes(todayStr);

    const finalShipping = isOrderDay ? 0 : (userExists.shippingCost || 0);
    const finalTax = isOrderDay ? 0 : (userExists.taxCost || 0);

    // Recalculate total price to include shipping and tax correctly
    const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const finalTotalPrice = itemsTotal + finalShipping + finalTax - (discount || 0);

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: finalTotalPrice,
        discount: discount || 0,
        shipping: finalShipping,
        tax: finalTax,
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
