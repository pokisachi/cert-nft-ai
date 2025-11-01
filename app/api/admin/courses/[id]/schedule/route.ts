import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = Number(params.id);

  // Lấy danh sách lớp đã xếp cho khóa này
  const classes = await prisma.scheduledClass.findMany({
    where: { courseId },
    include: {
      teacher: true,
      room: true,
      scheduledEnrollments: {
        include: {
          enrollment: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  // Chuẩn hóa dữ liệu trả về
  const data = classes.map((cls) => ({
    id: cls.id,
    dayOfWeek: cls.dayOfWeek,
    timeSlot: cls.timeSlot,
    teacherName: cls.teacher?.name ?? "—",
    roomId: cls.roomId,
    startDate: cls.startDate,
    endDate: cls.endDate,
    learners: cls.scheduledEnrollments
      .map(
        (se) =>
          `${se.enrollment.user?.name || "—"} (${se.enrollment.user?.email || "—"})`
      )
      .filter(Boolean),
  }));
  

  return NextResponse.json({ data });
}
