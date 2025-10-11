import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: "LEARNER" },
          { userId: user.id },
          { courseId: { in: courseIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: {
        OR: [
          { targetRole: "LEARNER" },
          { userId: user.id },
          { courseId: { in: courseIds } },
        ],
      },
    }),
  ]);

  // Bổ sung field giả lập isRead (nếu sau này có bảng read tracking)
  const mapped = items.map((n: { id: any; title: any; content: any; courseId: any; userId: any; createdAt: any; }) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    scope: n.courseId ? "course" : n.userId ? "personal" : "global",
    courseId: n.courseId,
    createdAt: n.createdAt,
    isRead: false, // TODO: có thể lưu trạng thái đọc riêng trong bảng user_notifications
  }));

  return NextResponse.json({ items: mapped, total });
}
