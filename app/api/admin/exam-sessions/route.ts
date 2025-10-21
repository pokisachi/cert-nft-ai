import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// 📋 Lấy danh sách tất cả kỳ thi
export async function GET() {
  const sessions = await prisma.examSession.findMany({
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { results: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

// 🧩 Tạo kỳ thi mới
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId, room, date, capacity } = await req.json();

  if (!courseId || !room || !date)
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });

  // ✅ Tạo ca thi mới
  const session = await prisma.examSession.create({
    data: {
      courseId,
      room,
      date: new Date(date),
      capacity: Number(capacity) || 0,
    },
  });

  // ✅ Tự động tạo ExamResult cho học viên ACTIVE
  const activeLearners = await prisma.enrollment.findMany({
    where: { courseId, status: "ACTIVE" },
  });

  if (activeLearners.length > 0) {
    await prisma.examResult.createMany({
      data: activeLearners.map((e) => ({
        examSessionId: session.id,
        userId: e.userId,
        score: 0,
        status: "PENDING",
      })),
    });
  }

  return NextResponse.json({
    message: "Tạo kỳ thi thành công!",
    session,
    addedLearners: activeLearners.length,
  });
}
