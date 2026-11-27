import { NextRequest, NextResponse } from "next/server";
import { exchangeCaJaToken, getPublicBaseUrl } from "@/lib/caja-client";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pdv-fabrica-premium-secret-key-2026"
);

function getDashboardRedirectUrl(role: string, baseUrl: string): string {
  switch (role) {
    case "ADMIN":
      return new URL("/admin/orders", baseUrl).toString();
    case "GESTOR":
      return new URL("/gestor", baseUrl).toString();
    case "SEPARADOR":
      return new URL("/separador", baseUrl).toString();
    case "CUSTOMER":
    default:
      return new URL("/user", baseUrl).toString();
  }
}

function resolvePostLoginUrl(
  role: string,
  baseUrl: string,
  statePath: string
): string {
  const isSafeRelative =
    statePath.startsWith("/") && !statePath.startsWith("//");
  if (isSafeRelative) {
    if (!statePath.startsWith("/admin") || role === "ADMIN") {
      return new URL(statePath, baseUrl).toString();
    }
  }
  return getDashboardRedirectUrl(role, baseUrl);
}

async function createSessionResponse(user: any, role: string, redirectUrl: string) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: role,
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    partitioned: isProd,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  // Clean pending cookie
  response.cookies.delete("caja_pending");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const statePath = request.nextUrl.searchParams.get("state")?.trim() || "";

  if (!code) {
    return NextResponse.json({ error: "Código de autorização não fornecido" }, { status: 400 });
  }

  try {
    const baseUrl = getPublicBaseUrl(request);
    const cajaData = await exchangeCaJaToken(code);
    const cajaUser = cajaData.user;

    // Normalize role to app-specific uppercase role
    let role = (cajaUser.role || "CUSTOMER").toUpperCase();
    if (role === "SUPERADM") {
      role = "ADMIN";
    } else if (role === "USUARIO" || role === "USER") {
      role = "CUSTOMER";
    }
    if (!["ADMIN", "GESTOR", "SEPARADOR", "CUSTOMER"].includes(role)) {
      role = "CUSTOMER";
    }

    // Scenario 1: Already linked
    const linkedUser = await prisma.user.findUnique({
      where: { cajaUserId: cajaUser.id }
    });

    if (linkedUser) {
      const updatedUser = await prisma.user.update({
        where: { id: linkedUser.id },
        data: { cajaRole: role, role: role }
      });
      return await createSessionResponse(
        updatedUser,
        role,
        resolvePostLoginUrl(role, baseUrl, statePath)
      );
    }

    // Scenario 2: Same email (re-vincula caso houvesse cajaUserId antigo/órfão)
    const sameEmailUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: cajaUser.email.trim(),
          mode: "insensitive",
        },
      },
    });

    if (sameEmailUser) {
      await prisma.user.updateMany({
        where: {
          cajaUserId: cajaUser.id,
          NOT: { id: sameEmailUser.id },
        },
        data: { cajaUserId: null },
      });

      const updatedUser = await prisma.user.update({
        where: { id: sameEmailUser.id },
        data: { cajaUserId: cajaUser.id, cajaRole: role, role: role }
      });
      return await createSessionResponse(
        updatedUser,
        role,
        resolvePostLoginUrl(role, baseUrl, statePath)
      );
    }

    // Scenario 3: Not found - Auto-provision local user via CaJa SSO
    await prisma.user.updateMany({
      where: { cajaUserId: cajaUser.id },
      data: { cajaUserId: null },
    });

    const normalizedEmail = cajaUser.email.trim().toLowerCase();
    let newUser = await prisma.user.create({
      data: {
        name: cajaUser.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        cajaUserId: cajaUser.id,
        cajaRole: role,
        role: role,
        mustChangePassword: false,
      },
    });

    if (role === "CUSTOMER") {
      try {
        const { createAsaasCustomer } = await import("@/lib/asaas");
        const asaasCustomer = await createAsaasCustomer({
          name: newUser.name,
          email: newUser.email,
          cnpj: "",
        });
        if (asaasCustomer && asaasCustomer.id) {
          newUser = await prisma.user.update({
            where: { id: newUser.id },
            data: { asaasCustomerId: asaasCustomer.id },
          });
        }
      } catch (asaasError) {
        console.error("Failed to create Asaas customer for new CaJa user:", asaasError);
      }
    }

    return await createSessionResponse(
      newUser,
      role,
      resolvePostLoginUrl(role, baseUrl, statePath)
    );

  } catch (error: any) {
    console.error("CaJa Callback Error:", error);
    return NextResponse.json({ error: error.message || "Falha na autenticação com CaJa" }, { status: 401 });
  }
}
