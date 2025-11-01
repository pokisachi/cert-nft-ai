import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ GET: Lấy danh sách chuyên môn
export async function GET() {
  const qualifications = await prisma.qualification.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(qualifications);
}

// ✅ POST: Thêm chuyên môn mới
export async function POST(req: Request) {
  try {
    const { name, category, description } = await req.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: "Thiếu thông tin chuyên môn hoặc loại chuyên môn" },
        { status: 400 }
      );
    }

    const qualification = await prisma.qualification.create({
      data: { name, category, description },
    });

    return NextResponse.json(qualification);
  } catch (error) {
    console.error("❌ Lỗi tạo chuyên môn:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// ✅ DELETE: Xóa chuyên môn (theo ID)
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id)
      return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

    await prisma.qualification.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa chuyên môn thành công" });
  } catch (error) {
    console.error("❌ Lỗi xóa chuyên môn:", error);
    return NextResponse.json({ error: "Không thể xóa chuyên môn" }, { status: 500 });
  }
}
