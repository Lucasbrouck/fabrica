import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, client_secret, email, password, cajaUser } = body;

    // 1. Autentica que a chamada realmente veio do servidor do CaJa
    if (
      !client_id ||
      !client_secret ||
      client_id !== process.env.CAJA_CLIENT_ID ||
      client_secret !== process.env.CAJA_CLIENT_SECRET
    ) {
      return NextResponse.json(
        { ok: false, error: 'Credenciais de cliente inválidas' },
        { status: 401 }
      );
    }

    if (!email || !password || !cajaUser?.id) {
      return NextResponse.json(
        { ok: false, error: 'Dados incompletos para verificação' },
        { status: 400 }
      );
    }

    // 2. Procura a conta local pelo email informado
    const localUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: String(email).trim(),
          mode: 'insensitive',
        },
      },
    });

    const storedHash = localUser?.password;
    if (!localUser || !storedHash) {
      return NextResponse.json(
        { ok: false, error: 'Conta não encontrada ou sem senha cadastrada neste app' },
        { status: 401 }
      );
    }

    // 3. Valida a senha da conta local
    const isPasswordValid = await bcrypt.compare(String(password), storedHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // 4. Determina a role que o usuário já possui localmente
    const userRole = localUser.cajaRole || localUser.role || 'CUSTOMER';

    // 5. Garante que nenhum outro registro retenha o mesmo cajaUserId e atualiza o vínculo local
    await prisma.user.updateMany({
      where: {
        cajaUserId: cajaUser.id,
        NOT: { id: localUser.id },
      },
      data: { cajaUserId: null },
    });

    await prisma.user.update({
      where: { id: localUser.id },
      data: {
        cajaUserId: cajaUser.id,
        cajaRole: userRole,
      },
    });

    // 6. Retorna sucesso + role para o CaJa liberar a permissão e concluir o login
    return NextResponse.json({
      ok: true,
      role: userRole,
    });
  } catch (error) {
    console.error('[CaJa Verify] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno na verificação' },
      { status: 500 }
    );
  }
}
