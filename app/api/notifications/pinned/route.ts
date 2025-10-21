// app/api/notifications/pinned/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pinned = await prisma.notification.findMany({
      where: { isPinned: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return NextResponse.json(pinned);
  } catch (error) {
    console.error("[GET /api/notifications/pinned]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
