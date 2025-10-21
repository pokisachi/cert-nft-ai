export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        dob: true,
        idcard: true,
        phone: true,
        address: true,
        walletAddress: true,
        avatarUrl: true,
        role: true,
        profileCompleted: true,
        row_version: true,
        createdAt: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ CHỖ NÀY LÀ FIX CHÍNH
    const serializedUser = {
      ...user,
      row_version: Number(user.row_version), // hoặc user.row_version.toString()
    };

    const res = NextResponse.json(serializedUser);
    res.headers.set("ETag", `W/"${serializedUser.row_version}"`);
    return res;
  } catch (err) {
    console.error("[GET /api/me/profile] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
