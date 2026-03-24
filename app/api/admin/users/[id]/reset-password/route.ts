import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }

    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      } as any,
    });

    return NextResponse.json({ message: "Senha resetada. O usuário deverá redefinir no Primeiro Acesso." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Erro ao resetar senha" }, { status: 500 });
  }
}
