import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-guard";

// 🧩 Lấy thông tin 1 khóa học
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> } // ✅ params là Promise
) {
  await assertAdminSession(req);
  const { id } = await context.params; // ✅ phải await

  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
  });

  if (!course)
    return NextResponse.json({ error: "Course not found" }, { status: 404 });

  return NextResponse.json(course);
}

// 🧩 Cập nhật khóa học
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminSession(req);
    const { id } = await context.params; // ✅ phải await
    const body = await req.json();

    const parsedData = {
      title: body.title,
      description: body.description || null,
      category: body.category,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      examDateExpected: body.examDateExpected
        ? new Date(body.examDateExpected)
        : null,
      status: body.status,
      isPublic: body.isPublic === true || body.isPublic === "true",
      thumbnail: body.thumbnail || null,
    };

    const updated = await prisma.course.update({
      where: { id: Number(id) },
      data: parsedData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🧩 Xóa khóa học
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminSession(req);
    const { id } = await context.params; // ✅ phải await
    await prisma.course.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Course deleted" });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
