import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ✅ Lấy danh sách phòng
export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { id: "asc" } });
  const roomIds = rooms.map((r) => r.id);
  const classes = await prisma.scheduledClass.findMany({
    where: { roomId: { in: roomIds } },
    select: { roomId: true, dayOfWeek: true, timeSlot: true },
  });
  const usedMap = new Map<string, Set<string>>();
  for (const c of classes) {
    const key = c.roomId;
    const set = usedMap.get(key) || new Set<string>();
    set.add(`${c.dayOfWeek}_${c.timeSlot}`);
    usedMap.set(key, set);
  }
  const data = rooms.map((r) => {
    const used = usedMap.get(r.id) || new Set<string>();
    const usedSlots = Array.from(used);
    const freeSlots = (r.availability || []).filter((s) => !used.has(s));
    return {
      ...r,
      scheduledCount: usedSlots.length,
      usedSlots,
      freeSlots,
    };
  });
  return NextResponse.json(data);
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
