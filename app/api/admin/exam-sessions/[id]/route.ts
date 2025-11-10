import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const sessionId = Number(id);
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      course: { select: { id: true, title: true, category: true } },
    },
  });
  if (!session) return NextResponse.json({ error: "Không tìm thấy kỳ thi" }, { status: 404 });
  return NextResponse.json(session);
}
