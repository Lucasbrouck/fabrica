import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const { name, price, categoryId } = await request.json();
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
