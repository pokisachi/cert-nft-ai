import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Cập nhật phòng học
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { capacity, availability } = await req.json();

    const room = await prisma.room.update({
      where: { id },
      data: {
        capacity: Number(capacity),
        availability: availability || [],
      },
    });

    return NextResponse.json({
      message: "Cập nhật phòng học thành công",
      data: room,
    });
  } catch (error) {
    console.error("❌ PUT /rooms/:id", error);
    return NextResponse.json({ error: "Không thể cập nhật phòng học" }, { status: 500 });
  }
}

// ✅ Xóa phòng học
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa phòng học thành công!" });
  } catch (error) {
    console.error("❌ DELETE /rooms/:id", error);
    return NextResponse.json({ error: "Không thể xóa phòng học" }, { status: 500 });
  }
}
