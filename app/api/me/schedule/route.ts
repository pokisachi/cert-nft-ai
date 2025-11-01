import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  // Lấy toàn bộ lịch học đã được AI xếp cho học viên
  const schedule = await prisma.scheduledEnrollment.findMany({
    where: {
      enrollment: {
        userId: user.id,
      },
    },
    include: {
      scheduledClass: {
        include: {
          course: true,
          teacher: true,
          room: true,
        },
      },
    },
  });

  const formatted = schedule.map((s) => ({
    course: s.scheduledClass.course.title,
    teacher: s.scheduledClass.teacher.name,
    room: s.scheduledClass.room.id,
    dayOfWeek: s.scheduledClass.dayOfWeek,
    timeSlot: s.scheduledClass.timeSlot,
    startDate: s.scheduledClass.startDate,
    endDate: s.scheduledClass.endDate,
  }));

  return NextResponse.json({ data: formatted });
}
