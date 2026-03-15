import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Nome e Email são obrigatórios" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    const defaultPassword = "123456";
    const finalPassword = password || defaultPassword;
    const mustChange = !password; // If password not sent, Admin created with default

    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "CUSTOMER",
        mustChangePassword: mustChange,
        cnpj: role === "CUSTOMER" ? body.cnpj : undefined,
        phone: role === "CUSTOMER" ? body.phone : undefined,
        postalCode: role === "CUSTOMER" ? body.postalCode : undefined,
        address: role === "CUSTOMER" ? body.address : undefined,
        addressNumber: role === "CUSTOMER" ? body.addressNumber : undefined,
        complement: role === "CUSTOMER" ? body.complement : undefined,
        province: role === "CUSTOMER" ? body.province : undefined,
        city: role === "CUSTOMER" ? body.city : undefined,
        state: role === "CUSTOMER" ? body.state : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
