// app/api/admin/certificates/issue-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json(
      { error: "INVALID_SESSION" },
      { status: 400 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // 1) Gọi API eligible để lấy danh sách học viên đủ điều kiện
  const el = await fetch(
    `${base}/api/admin/certificates/eligible?sessionId=${sessionId}`,
    { cache: "no-store" }
  );
  if (!el.ok) {
    return NextResponse.json(
      { error: "ELIGIBLE_FAILED" },
      { status: 500 }
    );
  }
  const data = await el.json();

  const minted: any[] = [];
  const skipped: any[] = [...(data.skipped ?? [])];

  // 2) Loop qua từng eligible, lấy preIssueHash gần nhất từ AI Dedup, rồi gọi /issue-final
  for (const item of data.eligible as any[]) {
    try {
      const latestAi = await prisma.aIDedupResult.findFirst({
        where: { userId: item.userId, courseId: item.courseId },
        orderBy: { checkedAt: "desc" },
      });

      if (!latestAi || latestAi.status !== "unique") {
        skipped.push({
          examResultId: item.examResultId,
          reason: latestAi ? "DEdup_NOT_UNIQUE" : "NO_AI_RESULT",
        });
        continue;
      }

      const r = await fetch(`${base}/api/certificates/issue-final`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          examResultId: item.examResultId,
          issue_date: new Date().toISOString().slice(0, 10),
          certificate_code: `BF-${new Date().getFullYear()}-${item.examResultId}`,
          issuer_name: "UNET.edu.vn",
          preIssueHash: latestAi.preIssueHash,
        })
      });

      const payload = await r.json();

      if (!r.ok) {
        skipped.push({
          examResultId: item.examResultId,
          reason: payload?.error ?? "ISSUE_FINAL_FAILED"
        });
        continue;
      }

      minted.push({
        examResultId: item.examResultId,
        tokenId: payload.tokenId,
        txHash: payload.txHash,
        ipfsCid: payload.ipfsCid,
        docHash: payload.docHash
      });
    } catch {
      skipped.push({
        examResultId: item.examResultId,
        reason: "NETWORK_ERROR"
      });
    }
  }

  return NextResponse.json({ sessionId, minted, skipped });
}
