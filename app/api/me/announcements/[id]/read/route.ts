import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationId = parseInt(params.id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // ✅ Ghi bản đọc vào bảng NotificationRead
    const record = await prisma.notificationRead.upsert({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId,
        },
      },
      update: { readAt: new Date() },
      create: {
        userId: user.id,
        notificationId,
      },
    });

    return NextResponse.json({ id: record.notificationId, isRead: true });
  } catch (err) {
    console.error("[PATCH_ANNOUNCEMENT_READ_ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
