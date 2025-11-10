import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = Number(searchParams.get("sessionId"));

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Lấy tất cả kết quả PASS cùng user/course
  const results = await prisma.examResult.findMany({
    where: { examSessionId: sessionId, status: "PASS" },
    include: {
      user: true,
      examSession: { include: { course: true } },
    },
  });

  if (results.length === 0) {
    return NextResponse.json({ sessionId, eligible: [], skipped: [] });
  }

  // Tập hợp userId + courseId duy nhất
  const pairs = results.map((r) => ({
    userId: r.userId,
    courseId: r.examSession.courseId,
  }));

  // Truy vấn song song (tối ưu IO)
  const [aiList, certList] = await Promise.all([
    prisma.aIDedupResult.findMany({
      where: {
        OR: pairs.map((p) => ({
          userId: p.userId,
          courseId: p.courseId,
        })),
      },
      orderBy: { checkedAt: "desc" },
    }),
    prisma.certificate.findMany({
      where: {
        OR: pairs.map((p) => ({
          userId: p.userId,
          courseId: p.courseId,
        })),
      },
    }),
  ]);

  const eligible: any[] = [];
  const skipped: any[] = [];

  for (const r of results) {
    const userId = r.userId;
    const courseId = r.examSession.courseId;
    const walletVerified = !!r.user.walletAddress;

    // lấy bản AI gần nhất
    const ai = aiList.find(
      (a) => a.userId === userId && a.courseId === courseId
    );

    // kiểm tra đã có chứng chỉ chưa
    const issued = certList.find(
      (c) => c.userId === userId && c.courseId === courseId
    );

    if (!ai) {
      skipped.push({ examResultId: r.id, reason: "NO_AI_RESULT" });
      continue;
    }
    if (ai.status !== "unique") {
      skipped.push({ examResultId: r.id, reason: "DEdup_NOT_UNIQUE" });
      continue;
    }
    if (issued) {
      skipped.push({ examResultId: r.id, reason: "CERT_ALREADY_ISSUED" });
      continue;
    }
    if (!walletVerified) {
      skipped.push({ examResultId: r.id, reason: "WALLET_MISSING" });
      continue;
    }

    eligible.push({
      examResultId: r.id,
      userId,
      courseId,
      studentName: r.user.name ?? "(Chưa đặt tên)",
      score: r.score,
      walletAddress: r.user.walletAddress,
      ai: {
        status: ai.status,
        similarityScore: ai.similarityScore,
        checkedAt: ai.checkedAt,
      },
    });
  }

  return NextResponse.json({
    sessionId,
    eligible,
    skipped,
  });
}
