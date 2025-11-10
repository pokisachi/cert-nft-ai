import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 Lấy danh sách kết quả thi theo ca thi
export async function GET(
  _: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const sessionIdNum = Number(sessionId);
    const results = await prisma.examResult.findMany({
      where: { examSessionId: sessionIdNum },
      include: {
        user: { select: { id: true, name: true, dob: true, email: true } },
        certificate: { select: { id: true, tokenId: true } },
      },
      orderBy: { id: "asc" },
    });

    const formatted = results.map((r) => ({
      examResultId: r.id,
      user: r.user,
      score: r.score,
      status: r.status,
      eligible: r.status === "PASS" && r.user.dob && r.examSessionId,
      locked: r.locked,
      certificate: r.certificate
        ? {
            id: r.certificate.id,
            verifyUrl: r.certificate.tokenId
              ? `https://verify.example.com/cert/${r.certificate.tokenId}`
              : null,
          }
        : { id: null, verifyUrl: null },
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    console.error("GET /exams/[sessionId]/results error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
