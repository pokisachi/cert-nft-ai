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

    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { id: true, title: true },
    });

    if (course) {
      const enrollmentIds = Array.from(
        new Set((scheduledEnrollments || []).map((e) => Number(e.enrollmentId)))
      ).filter((id) => !Number.isNaN(id));

      if (enrollmentIds.length > 0) {
        const enrollments = await prisma.enrollment.findMany({
          where: { id: { in: enrollmentIds } },
          select: { id: true, userId: true },
        });

        const notifyData = enrollments.map((enr) => ({
          title: "Lịch học đã được xác nhận",
          content: `Khoá ${course.title} đã có lịch học. Vào mục \"Lịch học của tôi\" để xem chi tiết.`,
          userId: enr.userId,
          courseId: course.id,
          isPinned: false,
        }));

        if (notifyData.length > 0) {
          await prisma.notification.createMany({ data: notifyData });
        }
      }

      await prisma.notification.create({
        data: {
          title: "Lịch học khoá đã được xác nhận",
          content: `Khoá ${course.title} đã được xếp lịch và lưu vào hệ thống.`,
          targetRole: "LEARNER",
          courseId: course.id,
          isPinned: false,
        },
      });
    }

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
