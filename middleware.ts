import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pdv-fabrica-premium-secret-key-2026"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  if (
    pathname === "/" ||
    pathname.includes("/api/auth") ||
    pathname.startsWith("/receipt") ||
    pathname.includes("/_next") ||
    pathname.includes("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|json|txt)$/)
  ) {
    // If the user is already authenticated and tries to access the login page (/),
    // redirect them to their respective dashboard based on their role
    if (pathname === "/" && token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        
        switch (role) {
          case "ADMIN":
            return NextResponse.redirect(new URL("/admin/orders", request.url));
          case "GESTOR":
            return NextResponse.redirect(new URL("/gestor", request.url));
          case "SEPARADOR":
            return NextResponse.redirect(new URL("/separador", request.url));
          case "CUSTOMER":
          default:
            return NextResponse.redirect(new URL("/user", request.url));
        }
      } catch (error) {
        // Token is invalid, let them stay on the login page
      }
    }
    return NextResponse.next();
  }

  // Not authenticated, redirect to unified login page (root)
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const mustChangePassword = payload.mustChangePassword as boolean;

    // Force password change if flagged
    if (mustChangePassword && pathname !== "/change-password" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // Check role permissions for specific routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    if (pathname.startsWith("/gestor") && role !== "GESTOR") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/separador") && role !== "SEPARADOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/user/") && role !== "CUSTOMER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    const response = NextResponse.redirect(new URL("/", request.url));
    // Provide a way to clear the bad token so they can log in again
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/gestor/:path*",
    "/separador/:path*",
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
