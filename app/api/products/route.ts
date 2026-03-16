import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
  });

  // Hack para Windows: busca barcodes via SQL puro para evitar travas de tipo Prisma
  const barcodes = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "barcode" FROM "Product"`);

  const formatted = products.map((p: any) => {
    const b = barcodes.find((b: any) => b.id === p.id);
    return {
      ...p,
      barcode: b ? b.barcode : null
    };
  });

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  try {
    const { name, price, categoryId, barcode } = await request.json();
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId,
        barcode: barcode && barcode.trim() !== "" ? barcode.trim() : null,
      } as any,
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
