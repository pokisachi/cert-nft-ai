import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🧱 Lấy danh sách các khóa học mà user đã ghi danh
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { enrolledAt: "desc" },
  });

  const mapped = enrollments.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    category: e.course.category,
    startDate: e.course.startDate,
    endDate: e.course.endDate,
    examDate: e.course.examDateExpected,
    status: e.status, // PENDING / ACTIVE / COMPLETED
  }));

  return NextResponse.json({ items: mapped, total: mapped.length });
}
