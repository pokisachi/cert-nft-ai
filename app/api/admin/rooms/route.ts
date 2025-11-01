import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Lấy danh sách phòng
export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rooms);
}

// ✅ Tạo phòng học mới
export async function POST(req: Request) {
  try {
    const { id, capacity, availability } = await req.json();
    if (!id || !capacity)
      return NextResponse.json({ error: "Thiếu thông tin phòng học" }, { status: 400 });

    const room = await prisma.room.create({
      data: { id, capacity, availability: availability || [] },
    });

    return NextResponse.json(room);
  } catch (err) {
    console.error("❌ POST /rooms", err);
    return NextResponse.json({ error: "Lỗi khi tạo phòng học" }, { status: 500 });
  }
}
