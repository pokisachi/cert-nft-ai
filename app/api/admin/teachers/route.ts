import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🧩 Lấy danh sách giảng viên
export async function GET() {
  const teachers = await prisma.teacher.findMany({
    include: {
      qualifications: {
        include: { qualification: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Gộp dữ liệu cho UI (flatten qualifications)
  const formatted = teachers.map((t) => ({
    ...t,
    qualifications: t.qualifications.map((q) => q.qualification.name),
  }));

  return NextResponse.json(formatted);
}

// 🧩 Tạo giảng viên mới
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, availability, qualificationIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Thiếu tên giảng viên" }, { status: 400 });
    }

    // 🧠 Kiểm tra chuyên môn
    if (!Array.isArray(qualificationIds) || qualificationIds.length === 0) {
      return NextResponse.json({ error: "Chưa chọn chuyên môn" }, { status: 400 });
    }

    // 🧩 Tạo giảng viên và gán chuyên môn qua bảng trung gian
    const teacher = await prisma.teacher.create({
      data: {
        name,
        availability,
        qualifications: {
          create: qualificationIds.map((id: string) => ({
            qualification: { connect: { id } },
          })),
        },
      },
      include: {
        qualifications: { include: { qualification: true } },
      },
    });

    return NextResponse.json({
      message: "Tạo giảng viên thành công!",
      teacher,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo giảng viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi tạo giảng viên." }, { status: 500 });
  }
}
