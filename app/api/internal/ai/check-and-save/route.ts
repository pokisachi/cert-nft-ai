// app/api/internal/ai/check-and-save/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function POST(req: Request) {
  try {
    // 1) AUTH BẮT BUỘC — chỉ Admin được phép gọi
    const auth = await getAuthUser(req as any);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { examResultId, pdfPreviewBase64 } = body;

    if (!examResultId || !pdfPreviewBase64) {
      return NextResponse.json(
        { success: false, error: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    // 2) Chỉ tin examResultId → lấy userId + courseId từ DB
    const examResult = await prisma.examResult.findUnique({
      where: { id: Number(examResultId) },
      select: {
        id: true,
        userId: true,
        examSession: {
          select: { courseId: true },
        },
      },
    });

    if (!examResult) {
      return NextResponse.json(
        { success: false, error: "EXAM_RESULT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const { userId, examSession } = examResult;
    const courseId = examSession.courseId;

    // 3) Decode PDF + tính preIssueHash
    const pdfBytes = Buffer.from(pdfPreviewBase64, "base64");
    const preIssueHash = sha256(pdfBytes);

    // 4) Gọi AI Dedup Service — nếu AI lỗi thì KHÔNG ghi unique
    let aiResult: any = null;
    let aiRaw: any = null;

    try {
      const url = `${process.env.AI_BASE_URL}/api/admin/certificates/ai-dedup-check`;

      const aiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              certId: `${userId}-${courseId}-${examResultId}`,
              studentName: "N/A",
              dob: "N/A",
              course: "N/A",
              pdfBase64: pdfPreviewBase64,
            },
          ],
          options: {
            topK: 3,
            // có thể truyền tiếp threshold nếu muốn
          },
        }),
      });

      const text = await aiRes.text();
      try {
        aiRaw = text ? JSON.parse(text) : null;
      } catch {
        aiRaw = text;
      }

      if (!aiRes.ok || !aiRaw || !aiRaw.results || !aiRaw.results[0]) {
        console.error("AI_DEDUP_HTTP_ERROR:", {
          status: aiRes.status,
          body: aiRaw,
        });

        return NextResponse.json(
          {
            success: false,
            error: "AI_SERVICE_ERROR",
            detail:
              (aiRaw && (aiRaw.detail || aiRaw.error)) ||
              `HTTP_${aiRes.status}`,
          },
          { status: 502 }
        );
      }

      aiResult = aiRaw.results[0];
    } catch (err) {
      console.error("AI_DEDUP_FETCH_ERROR:", err);
      return NextResponse.json(
        {
          success: false,
          error: "AI_SERVICE_UNREACHABLE",
        },
        { status: 502 }
      );
    }

    // 5) Lưu vào DB (upsert bằng preIssueHash)
    const saved = await prisma.aIDedupResult.upsert({
      where: {
        userId_courseId_preIssueHash: { userId, courseId, preIssueHash },
      },
      update: {
        status: aiResult.status,
        similarityScore: aiResult.similarityScore,
        checkedAt: new Date(),
      },
      create: {
        examResultId,
        userId,
        courseId,
        preIssueHash,
        status: aiResult.status,
        similarityScore: aiResult.similarityScore,
      },
    });

    return NextResponse.json({
      success: true,
      saved,
      ai: aiResult,
    });
  } catch (err: any) {
    console.error("[AI_DEDUP_SAVE_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
