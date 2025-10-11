// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export type SessionPayload = {
  uid: number;
  role: "ADMIN" | "LEARNER";
  email: string;
};

// 🧩 Ký JWT cho cookie session (login)
export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// 🧩 Xác thực JWT (verify)
export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}

// 🧩 Lấy thông tin user từ cookie session để dùng trong API routes
export async function getAuthUser(req: Request) {
  try {
    // Lấy cookie 'auth_token' (đặt ở login/route.ts)
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;

    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match) return null;

    const token = match[1];
    const session = await verifySession(token);

    // Tìm user trong DB
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
    });

    if (!user) return null;
    return user;
  } catch (err) {
    console.error("[getAuthUser] Error verifying session:", err);
    return null;
  }
}
