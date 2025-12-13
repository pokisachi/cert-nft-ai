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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const mapped = enrollments.map((e) => {
    const t = e.course.thumbnail || "";
    let thumbnailUrl = "/default-thumbnail.png";
    if (t) {
      if (t.startsWith("/courses/")) {
        thumbnailUrl = t;
      } else if (t.startsWith("blob:")) {
        thumbnailUrl = "/default-thumbnail.png";
      } else {
        thumbnailUrl = `${baseUrl}/courses/${t}`;
      }
    }
    return {
      id: e.course.id,
      title: e.course.title,
      category: e.course.category,
      startDate: e.course.startDate,
      endDate: e.course.endDate,
      examDate: e.course.examDateExpected,
      status: e.status,
      thumbnailUrl,
    };
  });

  return NextResponse.json({ items: mapped, total: mapped.length });
}
