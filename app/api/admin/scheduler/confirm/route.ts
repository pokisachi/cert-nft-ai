import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Định nghĩa kiểu dữ liệu nhận từ FastAPI
interface ScheduledClassInput {
  courseId: number;
  teacherId: string;
  roomId: string;
  dayOfWeek: string;
  timeSlot: string;
  startDate: string;
  endDate: string;
}

interface ScheduledEnrollmentInput {
  scheduledClassId: number;
  enrollmentId: number;
}

// ⚙️ API nhận dữ liệu duyệt từ client
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { courseId, schedule } = body;
    const { scheduledClasses, scheduledEnrollments } = schedule as {
      scheduledClasses: ScheduledClassInput[];
      scheduledEnrollments: ScheduledEnrollmentInput[];
    };

    if (!courseId || !scheduledClasses?.length) {
      return NextResponse.json({ error: 'Thiếu dữ liệu để lưu' }, { status: 400 });
    }

    // 🧹 Xóa các lịch cũ trước khi lưu mới
    await prisma.scheduledEnrollment.deleteMany({
      where: { scheduledClass: { courseId } },
    });
    await prisma.scheduledClass.deleteMany({
      where: { courseId },
    });

    // 🧩 Tạo các ScheduledClass mới
    const createdClasses = await prisma.$transaction(
      scheduledClasses.map((c: ScheduledClassInput) =>
        prisma.scheduledClass.create({
          data: {
            courseId: c.courseId,
            teacherId: c.teacherId,
            roomId: c.roomId,
            dayOfWeek: c.dayOfWeek,
            timeSlot: c.timeSlot,
            startDate: new Date(c.startDate),
            endDate: new Date(c.endDate),
          },
        })
      )
    );

    // 🔗 Map tạm giữa thứ tự trong JSON và ID thật trong DB
    const classMap = new Map<number, number>();
    createdClasses.forEach((c, idx) => {
      classMap.set(idx + 1, c.id);
    });

    // 🧮 Lưu ScheduledEnrollment
    await prisma.$transaction(
      scheduledEnrollments.map((e: ScheduledEnrollmentInput) =>
        prisma.scheduledEnrollment.create({
          data: {
            scheduledClassId: classMap.get(e.scheduledClassId)!,
            enrollmentId: e.enrollmentId,
          },
        })
      )
    );

    return NextResponse.json({
      message: '✅ Đã lưu lịch học vào cơ sở dữ liệu thành công.',
      count: {
        classes: createdClasses.length,
        enrollments: scheduledEnrollments.length,
      },
    });
  } catch (err) {
    console.error('❌ Lỗi khi lưu lịch học:', err);
    return NextResponse.json({ error: 'Lỗi khi lưu dữ liệu.' }, { status: 500 });
  }
}
