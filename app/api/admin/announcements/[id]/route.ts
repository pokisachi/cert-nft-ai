// [GET, PUT, DELETE] /api/admin/announcements/:id
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client"; // ✅ import type thay vì value — không bị "unused-var"

// -------------------------------
// 📘 [GET] Lấy chi tiết thông báo
// -------------------------------
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json(notification);
}

// -------------------------------
// 📝 [PUT] Cập nhật thông báo
// -------------------------------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const { title, content, targetRole, courseId, isPinned } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        title,
        content,
        targetRole: targetRole as Role,
        courseId: courseId ? Number(courseId) : null,
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// -------------------------------
// 🗑️ [DELETE] Xóa thông báo
// -------------------------------
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.notification.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
