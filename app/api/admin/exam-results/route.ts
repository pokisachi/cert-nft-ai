import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionId = Number(req.nextUrl.searchParams.get("sessionId"));
  if (!sessionId) {
    return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
  }

  const results = await prisma.examResult.findMany({
    where: { examSessionId: sessionId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const data = results.map((r) => ({
    id: r.id,
    learner: r.user,
    score: r.score,
    status: r.status,
  }));

  return NextResponse.json({ data });
}
