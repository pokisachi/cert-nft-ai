import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Role, EnrollStatus } from "@prisma/client";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để đăng ký khóa học." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const courseId = Number(id);
    if (Number.isNaN(courseId)) {
      return NextResponse.json(
        { error: "Mã khóa học không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { availableSlots } = body;

    if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một khung giờ có thể học." },
        { status: 400 }
      );
    }

    const allAreValidStrings = availableSlots.every(
      (slot: any) => typeof slot === "string" && slot.includes("_")
    );
    if (!allAreValidStrings) {
      return NextResponse.json(
        { error: "Dữ liệu khung giờ đăng ký không hợp lệ." },
        { status: 400 }
      );
    }

    if (user.role !== Role.LEARNER) {
      return NextResponse.json(
        { error: "Chỉ học viên mới có thể đăng ký khóa học." },
        { status: 403 }
      );
    }

    if (!user.name || !user.phone || !user.dob) {
      return NextResponse.json(
        { error: "Vui lòng hoàn thiện hồ sơ cá nhân trước khi đăng ký." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Không tìm thấy khóa học." },
        { status: 404 }
      );
    }

    if (course.status !== "UPCOMING") {
      return NextResponse.json(
        {
          error: `Khóa học hiện đang ở trạng thái "${course.status}", không thể đăng ký.`,
        },
        { status: 403 }
      );
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bạn đã đăng ký khóa học này trước đó." },
        { status: 409 }
      );
    }

    // 💥 CHỖ THAY ĐỔI 1: luôn tạo enrollment ở trạng thái ACTIVE
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        status: EnrollStatus.ACTIVE, // 💥 auto ACTIVE thay vì "PENDING"
        availableSlots,
      },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    // 💥 CHỖ THAY ĐỔI 2: ghi log hoặc gửi thông báo chính xác hơn
    await prisma.notification.create({
      data: {
        title: "Đăng ký khóa học thành công 🎉",
        content: `Bạn đã đăng ký khóa học "${enrollment.course.title}" thành công.`,
        userId: user.id,
      },
    });

    // 💥 CHỖ THAY ĐỔI 3: trả về rõ ràng thông tin enrollment
    return NextResponse.json({
      message: "Đăng ký khóa học thành công!",
      enrollmentId: enrollment.id,
      course: enrollment.course,
      availableSlots: enrollment.availableSlots,
      status: enrollment.status,
      createdAt: enrollment.enrolledAt,
    });
  } catch (error) {
    console.error("❌ Enroll error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đăng ký khóa học." },
      { status: 500 }
    );
  }
}

// ==================================================================
// DELETE - Giữ nguyên (không cần thay đổi)
// ==================================================================
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để hủy đăng ký." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const courseId = Number(id);
    if (Number.isNaN(courseId)) {
      return NextResponse.json(
        { error: "Mã khóa học không hợp lệ." },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Bạn chưa đăng ký khóa học này." },
        { status: 404 }
      );
    }

    await prisma.enrollment.delete({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    await prisma.notification.create({
      data: {
        title: "Hủy đăng ký khóa học",
        content: `Bạn đã hủy đăng ký khóa học #${courseId}.`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Hủy đăng ký thành công.",
    });
  } catch (error) {
    console.error("❌ Cancel enrollment error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi hủy đăng ký." },
      { status: 500 }
    );
  }
}
