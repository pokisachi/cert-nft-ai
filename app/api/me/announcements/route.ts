import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 5);
  const offset = Number(searchParams.get("offset") ?? 0);

  const userCourseIds = await prisma.examResult.findMany({
    where: { userId: user.id },
    select: { examSession: { select: { courseId: true } } },
  });
  const courseIds = [...new Set(userCourseIds.map((r: { examSession: { courseId: any; }; }) => r.examSession.courseId))];

  const where: Prisma.NotificationWhereInput = {
    OR: [
      { targetRole: "LEARNER" },
      { userId: user.id },
      { courseId: { in: courseIds } },
    ],
  };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        content: true,
        courseId: true,
        userId: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  const ids = items.map((n) => n.id);
  const reads = ids.length
    ? await prisma.notificationRead.findMany({
        where: { userId: user.id, notificationId: { in: ids } },
        select: { notificationId: true },
      })
    : [];
  const readSet = new Set(reads.map((r) => r.notificationId));

  const mapped = items.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    scope: n.courseId ? "course" : n.userId ? "personal" : "global",
    courseId: n.courseId,
    createdAt: n.createdAt,
    isRead: readSet.has(n.id),
  }));

  const readCount = await prisma.notificationRead.count({
    where: {
      userId: user.id,
      notification: {
        OR: [
          { targetRole: "LEARNER" },
          { userId: user.id },
          { courseId: { in: courseIds } },
        ],
      },
    },
  });

  const unreadCount = Math.max(0, total - readCount);

  return NextResponse.json({ items: mapped, total, unreadCount });
}
