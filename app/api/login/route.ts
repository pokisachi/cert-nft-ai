export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { Magic } from "@magic-sdk/admin";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";

// ⚠️ Key secret của Magic (server-side)
const magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // Lấy DID token từ header Authorization: Bearer <token>
  const didToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!didToken) {
    return NextResponse.json({ error: "Missing DID token" }, { status: 401 });
  }

  try {
    // 1) Validate DID token với Magic
    await magicAdmin.token.validate(didToken);

    // 2) Lấy metadata (email, ví công khai)
    const meta = await magicAdmin.users.getMetadataByToken(didToken);
    const email = meta.email;
    const publicAddress = meta.publicAddress;

    if (!email) {
      return NextResponse.json({ error: "Email not found from Magic" }, { status: 400 });
    }

    // 3) Map vào DB: tìm user theo email; nếu chưa có → tạo (mặc định role LEARNER)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          walletAddress: publicAddress ?? null,
          role: "LEARNER",
        },
      });
    } else if (!user.walletAddress && publicAddress) {
      // Cập nhật ví nếu trước đó chưa có
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: publicAddress },
      });
    }

    // 4) Tạo JWT session & set cookie httpOnly
    const token = await signSession({ uid: user.id, role: user.role, email: user.email });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    cookieStore.set("pc", user.profileCompleted ? "1" : "0", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // 5) Trả role để client điều hướng
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error("Login error", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
