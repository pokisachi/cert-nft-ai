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

    // ✅ Fix BigInt serialization
    return NextResponse.json(toSerializable(learner));
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
