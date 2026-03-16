import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, categoryId, barcode } = body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        categoryId,
        barcode: barcode && barcode.trim() !== "" ? barcode.trim() : null,
      } as any,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[Product API] Error updating product:", error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First check if the product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json({ 
        error: `Não é possível excluir: este produto possui ${product._count.orderItems} itens de pedido vinculados.` 
      }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Product API] Error deleting product:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
