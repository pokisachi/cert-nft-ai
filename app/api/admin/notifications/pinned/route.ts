// [GET] /api/notifications/pinned
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pinned = await prisma.notification.findMany({
    where: { isPinned: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json(pinned);
}
