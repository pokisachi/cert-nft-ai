import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@prisma/client";

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

    // 🧩 Parse body
    const body = await req.json().catch(() => ({}));
    const preferredDays = body?.preferredDays || "";
    const preferredTime = body?.preferredTime || "";
    const validTimes = ["EVENING_1", "EVENING_2", "MORNING", "AFTERNOON"];
if (!validTimes.includes(preferredTime)) {
  return NextResponse.json(
    { error: "Ca học không hợp lệ." },
    { status: 400 }
  );
}


    // ⚠️ Validate đầu vào
    if (!preferredDays || !preferredTime) {
      return NextResponse.json(
        { error: "Vui lòng chọn đầy đủ Thứ học và Ca học." },
        { status: 400 }
      );
    }

    // 🧩 Kiểm tra role
    if (user.role !== Role.LEARNER) {
      return NextResponse.json(
        { error: "Chỉ học viên mới có thể đăng ký khóa học." },
        { status: 403 }
      );
    }

    // 🧩 Kiểm tra hồ sơ
    if (!user.name || !user.phone || !user.dob) {
      return NextResponse.json(
        { error: "Vui lòng hoàn thiện hồ sơ cá nhân trước khi đăng ký." },
        { status: 400 }
      );
    }

    // ✅ Kiểm tra trạng thái khóa học
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

    // 🧩 Kiểm tra trùng đăng ký
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bạn đã đăng ký khóa học này trước đó." },
        { status: 409 }
      );
    }

    // ✅ Tạo bản ghi đăng ký
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        status: "PENDING",
        preferredDays, // 🆕 Lưu thứ học
        preferredTime, // 🆕 Lưu ca học
      },
    });

    // 📨 Gửi thông báo
    await prisma.notification.create({
      data: {
        title: "Đăng ký khóa học thành công 🎉",
        content: `Bạn đã đăng ký khóa học #${courseId} thành công.`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Đăng ký khóa học thành công!",
      data: enrollment,
    });
  } catch (error) {
    console.error("❌ Enroll error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đăng ký khóa học." },
      { status: 500 }
    );
  }
}
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

    // 🧩 Kiểm tra xem có bản ghi enrollment không
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Bạn chưa đăng ký khóa học này." },
        { status: 404 }
      );
    }

    // ✅ Xóa bản ghi
    await prisma.enrollment.delete({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    // 📨 Thông báo hủy
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
