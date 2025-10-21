import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/login")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // ✅ Chỉ verify JWT, không gọi Prisma
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as any).role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/me", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.warn("Invalid or expired token:", err);
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/me/:path*", "/admin/:path*", "/api/me/:path*"],
};
