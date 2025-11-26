import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    const courseIds = Array.from(new Set(enrollments.map((e) => e.courseId)));

    const notifs = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: "LEARNER" },
          { userId: user.id },
          { courseId: { in: courseIds } },
        ],
      },
      select: { id: true },
    });
    const ids = notifs.map((n) => n.id);
    if (ids.length === 0) return NextResponse.json({ count: 0 });

    await prisma.notificationRead.createMany({
      data: ids.map((id) => ({ userId: user.id, notificationId: id })),
      skipDuplicates: true,
    });

    return NextResponse.json({ count: ids.length });
  } catch (err) {
    console.error("[PATCH_ANNOUNCEMENTS_READ_ALL_ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

