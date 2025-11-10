import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examResultId, userId, courseId, pdfPreviewBase64 } = body;

    if (!examResultId || !userId || !courseId || !pdfPreviewBase64)
      return NextResponse.json(
        { success: false, error: "Thiếu tham số bắt buộc" },
        { status: 400 }
      );

    const pdfBytes = Buffer.from(pdfPreviewBase64, "base64");
    const preIssueHash = sha256(pdfBytes);

    // Gọi AI Dedup Service
    const aiRes = await fetch(
      process.env.AI_BASE_URL + "/api/admin/certificates/ai-dedup-check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              certId: `${courseId}-${userId}-${examResultId}`,
              studentName: "N/A",
              dob: "2000-01-01",
              course: "N/A",
              pdfBase64: pdfPreviewBase64,
            },
          ],
          options: { topK: 3 },
        }),
      }
    ).then((r) => r.json());

const result = aiRes.results?.[0] || {
  status: "unique",
  similarityScore: 0.01,
};


    // Ghi hoặc cập nhật kết quả vào DB
    const saved = await prisma.aIDedupResult.upsert({
      where: {
        userId_courseId_preIssueHash: { userId, courseId, preIssueHash },
      },
      update: {
        status: result.status,
        similarityScore: result.similarityScore,
        checkedAt: new Date(),
      },
      create: {
        examResultId,
        userId,
        courseId,
        preIssueHash,
        status: result.status,
        similarityScore: result.similarityScore,
      },
    });

    return NextResponse.json({
      success: true,
      saved,
      ai: result,
    });
  } catch (err: any) {
    console.error("[AI_DEDUP_SAVE_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
