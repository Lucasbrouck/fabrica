import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pdv-fabrica-premium-secret-key-2026"
);

export async function POST(request: NextRequest) {
  const pendingCookie = request.cookies.get("caja_pending")?.value;

  if (!pendingCookie) {
    return NextResponse.json(
      { error: "Sessão expirada. Faça login novamente pelo CaJa." },
      { status: 400 }
    );
  }

  let cajaUser;
  try {
    cajaUser = JSON.parse(pendingCookie);
  } catch (err) {
    return NextResponse.json(
      { error: "Dados temporários de login inválidos." },
      { status: 400 }
    );
  }

  const { action, email, password } = await request.json();

  try {
    let localUser;

    if (action === "create-new") {
      // 1. Double check if email already registered locally (to prevent race conditions/duplicate error)
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: {
            equals: String(cajaUser.email).trim(),
            mode: "insensitive",
          },
        },
      });

      if (existingEmail) {
        // Clear any stale reference to this cajaUserId on another record before linking
        await prisma.user.updateMany({
          where: {
            cajaUserId: cajaUser.id,
            NOT: { id: existingEmail.id },
          },
          data: { cajaUserId: null },
        });

        // Link automatically (overwriting old/orphan cajaUserId if present)
        localUser = await prisma.user.update({
          where: { id: existingEmail.id },
          data: {
            cajaUserId: cajaUser.id,
            cajaRole: cajaUser.role,
            role: cajaUser.role
          }
        });
      } else {
        // Clear any stale reference to this cajaUserId on another record before creating
        await prisma.user.updateMany({
          where: { cajaUserId: cajaUser.id },
          data: { cajaUserId: null },
        });

        // Create new local user with CaJa details
        localUser = await prisma.user.create({
          data: {
            name: cajaUser.name,
            email: String(cajaUser.email).trim(),
            cajaUserId: cajaUser.id,
            cajaRole: cajaUser.role,
            role: cajaUser.role,
          }
        });

        // Integrated Asaas Customer creation for consistency
        try {
          const { createAsaasCustomer } = await import("@/lib/asaas");
          const asaasCustomer = await createAsaasCustomer({
            name: localUser.name,
            email: localUser.email,
            cnpj: "",
          });

          if (asaasCustomer && asaasCustomer.id) {
            localUser = await prisma.user.update({
              where: { id: localUser.id },
              data: { asaasCustomerId: asaasCustomer.id }
            });
          }
        } catch (asaasError) {
          console.error("Failed to create Asaas customer for new CaJa user:", asaasError);
        }
      }

    } else if (action === "link-existing") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "E-mail e senha são obrigatórios para vincular." },
          { status: 400 }
        );
      }

      // Check credentials of local existing account (case-insensitive)
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: String(email).trim(),
            mode: "insensitive",
          },
        },
      });

      if (!existingUser || !existingUser.password) {
        return NextResponse.json(
          { error: "Conta não encontrada ou não configurada para login local." },
          { status: 404 }
        );
      }

      const isValid = await bcrypt.compare(password, existingUser.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Senha incorreta." },
          { status: 401 }
        );
      }

      // Clear any stale reference to this cajaUserId on another record before linking
      await prisma.user.updateMany({
        where: {
          cajaUserId: cajaUser.id,
          NOT: { id: existingUser.id },
        },
        data: { cajaUserId: null },
      });

      // Link (or re-link orphan cajaUserId) local account to CaJa
      localUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          cajaUserId: cajaUser.id,
          cajaRole: cajaUser.role,
          role: cajaUser.role,
        }
      });

    } else {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    // Sign session JWT
    const token = await new SignJWT({
      id: localUser.id,
      email: localUser.email,
      role: cajaUser.role,
      mustChangePassword: localUser.mustChangePassword || false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, role: cajaUser.role });
    
    // Set local authentication cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Delete the pending SSO registration cookie
    response.cookies.delete("caja_pending");

    return response;

  } catch (error: any) {
    console.error("caja-link error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
