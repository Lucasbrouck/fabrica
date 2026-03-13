import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[Category API] Error updating category:", error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there are products in this category
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${productsCount} produtos nesta categoria.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Category API] Error deleting category:", error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
