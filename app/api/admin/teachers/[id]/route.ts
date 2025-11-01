import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🧩 Sửa giảng viên
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, availability, qualificationIds } = await req.json();
    const { id } = params;

    // Xóa các liên kết chuyên môn cũ trước khi cập nhật
    await prisma.teacherQualification.deleteMany({
      where: { teacherId: id },
    });

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name,
        availability,
        qualifications: {
          create: qualificationIds.map((qid: string) => ({
            qualification: { connect: { id: qid } },
          })),
        },
      },
      include: {
        qualifications: { include: { qualification: true } },
      },
    });

    return NextResponse.json({
      message: "Cập nhật giảng viên thành công!",
      teacher,
    });
  } catch (err) {
    console.error("❌ PUT /teachers/:id", err);
    return NextResponse.json({ error: "Lỗi cập nhật giảng viên" }, { status: 500 });
  }
}

// 🧩 Xóa giảng viên
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.teacher.delete({ where: { id } });
    return NextResponse.json({ message: "Đã xóa giảng viên thành công!" });
  } catch (err) {
    console.error("❌ DELETE /teachers/:id", err);
    return NextResponse.json({ error: "Không thể xóa giảng viên" }, { status: 500 });
  }
}
