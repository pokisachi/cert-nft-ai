import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 5);
  const offset = Number(searchParams.get("offset") ?? 0);

  // Lấy danh sách course có user tham gia (qua ExamResult)
  const courseIds = await prisma.examResult.findMany({
    where: { userId: user.id },
    select: { examSession: { select: { courseId: true } } },
  });

  const ids = [...new Set(courseIds.map((r: { examSession: { courseId: any; }; }) => r.examSession.courseId))];

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: ids } },
      orderBy: { startDate: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.course.count({ where: { id: { in: ids } } }),
  ]);

  const mapped = items.map((c: { id: any; title: any; startDate: any; endDate: any; examDateExpected: any; status: any; }) => ({
    id: c.id,
    title: c.title,
    startDate: c.startDate,
    endDate: c.endDate,
    examDate: c.examDateExpected,
    status: c.status,
  }));

  return NextResponse.json({ items: mapped, total });
}
