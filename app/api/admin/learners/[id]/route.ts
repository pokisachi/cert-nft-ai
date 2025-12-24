import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@prisma/client";

// =====================
// 🔧 Helper: Chuyển BigInt → Number (tránh lỗi JSON)
// =====================
function toSerializable(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

// =====================
// 🧩 GET - Lấy chi tiết học viên
// =====================
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const learnerId = Number(id);
    if (isNaN(learnerId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const learner = await prisma.user.findUnique({
      where: { id: learnerId },
      include: {
        _count: {
          select: {
            examResults: true,
            certificates: true,
          },
        },
      },
    });

    if (!learner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 📚 Lộ trình học (Enrollments) của học viên
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: learnerId },
      include: { course: true },
      orderBy: { enrolledAt: "desc" },
    });

    // 🪪 Chứng chỉ đã cấp cho học viên
    const certificates = await prisma.certificate.findMany({
      where: { userId: learnerId },
      include: { course: true },
      orderBy: { issuedAt: "desc" },
    });

    const now = new Date();
    const enrollmentsMapped = enrollments.map((e) => {
      let progress = 0;
      if ((e as any).status === "COMPLETED") {
        progress = 100;
      } else {
        const s = (e as any).course.startDate ? new Date((e as any).course.startDate) : null;
        const ed = (e as any).course.endDate ? new Date((e as any).course.endDate) : null;
        if (s && ed && ed.getTime() > s.getTime()) {
          const total = ed.getTime() - s.getTime();
          const done = Math.max(0, Math.min(total, now.getTime() - s.getTime()));
          progress = Math.max(0, Math.min(100, Math.floor((done / total) * 100)));
        }
      }
      return {
        id: String(e.id),
        courseName: e.course.title,
        progress,
        status: (e as any).status === "COMPLETED" ? "Completed" : "Studying",
        lastAccess: ((e as any).updatedAt ?? (e as any).enrolledAt)?.toISOString?.() ?? new Date().toISOString(),
      };
    });

    const certificatesMapped = certificates.map((c) => ({
      id: Number(c.id),
      courseId: Number((c as any).courseId ?? c.course?.id ?? 0),
      courseTitle: c.course?.title ?? "—",
      tokenId: (c as any).tokenId ?? null,
      issuedAt: (c as any).issuedAt ?? null,
      status: (c as any).revoked ? "REVOKED" : "VALID",
      pdfUrl: `/cdn/cert/${c.id}.pdf`,
      explorerUrl: (c as any).tokenId ? `https://victionscan.io/token/${(c as any).tokenId}` : null,
    }));

    const payload = {
      ...learner,
      enrollments: enrollmentsMapped,
      certificates: certificatesMapped,
    };

    // ✅ Fix BigInt serialization
    return NextResponse.json(toSerializable(payload));
  } catch (err) {
    console.error("❌ GET /api/admin/learners/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// =====================
// 🧩 PUT - Cập nhật thông tin học viên
// =====================
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const learnerId = Number(id);
    if (isNaN(learnerId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, address, avatarUrl } = body;

    // ⚙️ Cập nhật dữ liệu học viên
    const learner = await prisma.user.update({
      where: { id: learnerId },
      data: {
        name: name ?? undefined,
        phone: phone ?? undefined,
        address: address ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, learner: toSerializable(learner) });
  } catch (err) {
    console.error("❌ PUT /api/admin/learners/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// =====================
// 🧩 PATCH - Cấp/Gỡ quyền admin cho người dùng
// =====================
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const actor = await getAuthUser(req);
    if (!actor || actor.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetId = Number(id);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const nextRoleRaw = body.role;
    if (!nextRoleRaw || typeof nextRoleRaw !== "string") {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    const nextRole =
      nextRoleRaw === "ADMIN"
        ? Role.ADMIN
        : nextRoleRaw === "LEARNER"
        ? Role.LEARNER
        : null;

    if (!nextRole) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Không cho tự hạ quyền chính mình qua API này (an toàn)
    if (actor.id === targetId && nextRole !== Role.ADMIN) {
      return NextResponse.json({ error: "Cannot demote self" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role: nextRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("❌ PATCH /api/admin/learners/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// =====================
// 🧩 DELETE - Xóa học viên an toàn
// =====================
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const learnerId = Number(id);
    if (isNaN(learnerId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const learner = await prisma.user.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (learner.role === Role.ADMIN) {
      return NextResponse.json(
        { error: "Cannot delete admin" },
        { status: 400 }
      );
    }

    // 🧩 Xóa dữ liệu liên quan (an toàn)
    await prisma.notificationRead
      .deleteMany({ where: { userId: learnerId } })
      .catch(() => {});
    await prisma.notification
      .deleteMany({ where: { userId: learnerId } })
      .catch(() => {});
    await prisma.examResult
      .deleteMany({ where: { userId: learnerId } })
      .catch(() => {});
    await prisma.certificate
      .deleteMany({ where: { userId: learnerId } })
      .catch(() => {});

    await prisma.user.delete({ where: { id: learnerId } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ DELETE /api/admin/learners/[id] error:", err);

    if (err.code === "P2003") {
      // 🔐 Lỗi khóa ngoại (vẫn còn dữ liệu ràng buộc)
      return NextResponse.json(
        { error: "Cannot delete user with linked records" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
