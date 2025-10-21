import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ phải await
  const sessionId = Number(id);

  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      course: { select: { id: true, title: true, category: true } },
      results: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!session)
    return NextResponse.json({ error: "Không tìm thấy kỳ thi" }, { status: 404 });

  return NextResponse.json(session);
}

// ✅ Thêm DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = Number(params.id);

    // Xóa toàn bộ kết quả thi trước (nếu có)
    await prisma.examResult.deleteMany({ where: { examSessionId: id } });

    // Rồi xóa kỳ thi
    await prisma.examSession.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa kỳ thi thành công" });
  } catch (err) {
    console.error("DELETE exam session error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi xóa kỳ thi" }, { status: 500 });
  }
}
