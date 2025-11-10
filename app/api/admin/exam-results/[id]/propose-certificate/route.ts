import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";
import { aiDedupClient } from "@/lib/aiDedupClient";
import { logAudit } from "@/lib/audit";

// Mock function to generate certificate text preview
// In a real implementation, this would generate the actual certificate content
function generateCertificateTextPreview(result: any): string {
  return `Chứng chỉ hoàn thành khóa học ${result.examSession.course.title} tại Trung tâm Đào tạo Quốc tế. Học viên: ${result.user.name}, Ngày sinh: ${result.user.dob ? new Date(result.user.dob).toLocaleDateString('vi-VN') : 'N/A'}, ${result.user.idcard ? `CMND: ${result.user.idcard}` : ''}, Khóa học: ${result.examSession.course.title}, Ngày thi: ${result.examSession.date ? new Date(result.examSession.date).toLocaleDateString('vi-VN') : 'N/A'}, Điểm: ${result.score}, Xếp loại: ${result.status}. Chứng chỉ có giá trị 2 năm kể từ ngày cấp.`;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const resultId = Number(id);
    const user = await getAuthUser(req);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔍 Lấy dữ liệu exam result
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        user: true,
        examSession: { include: { course: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Không tìm thấy kết quả" }, { status: 404 });
    }

    if (result.status !== "PASS") {
      return NextResponse.json({ error: "Chỉ cấp chứng chỉ cho học viên đậu" }, { status: 400 });
    }

    // 📄 Generate certificate text preview for dedup check
    const certificateTextPreview = generateCertificateTextPreview(result);
    const docHash = crypto.createHash('sha256').update(certificateTextPreview).digest('hex');

    // 🤖 Check for duplicates using AI service
    let dedupCheckResult;
    try {
      dedupCheckResult = await aiDedupClient.check(docHash, certificateTextPreview);
      
      // 🧾 Audit log for AI dedup check
      await logAudit({
        actorId: user.id,
        action: "AI_DEDUP_CHECK",
        entity: "ExamResult",
        entityId: result.id.toString(),
        payload: { 
          docHash, 
          isExactDuplicate: dedupCheckResult.isExactDuplicate,
          candidates: dedupCheckResult.candidates?.length || 0
        },
      });
    } catch (error) {
      console.error("❌ AI Dedup service error:", error);
      
      // 🧾 Audit log for AI unavailable
      await logAudit({
        actorId: user.id,
        action: "AI_UNAVAILABLE",
        entity: "ExamResult",
        entityId: result.id.toString(),
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      // If AI service is unavailable, proceed with certificate issuance (fail-safe)
      // In a production environment, you might want to handle this differently
      dedupCheckResult = { isExactDuplicate: false, candidates: [] };
    }

    // 🚫 Block if exact duplicate found
    if (dedupCheckResult.isExactDuplicate) {
      return NextResponse.json({
        requireAdminDecision: true,
        type: "EXACT",
        candidates: [dedupCheckResult.exactMatch],
        message: "Phát hiện chứng chỉ trùng exact. Cần quyết định của admin.",
      }, { status: 409 });
    }

    // ⚠️ Require admin decision if similar certificates found
    if (dedupCheckResult.candidates && dedupCheckResult.candidates.length > 0) {
      return NextResponse.json({
        requireAdminDecision: true,
        type: "SIMILAR",
        candidates: dedupCheckResult.candidates,
        checkId: docHash, // Using docHash as checkId for simplicity
        message: "Phát hiện chứng chỉ tương tự. Cần quyết định của admin.",
      }, { status: 409 });
    }

    // ✅ No duplicates found, proceed with certificate issuance
    const tokenId = `tk_${Date.now()}`;
    const ipfsCid = `bafy${Math.random().toString(36).substring(2, 10)}`;

    const cert = await prisma.certificate.create({
      data: {
        userId: result.userId,
        courseId: result.examSession.courseId,
        examResultId: result.id,
        tokenId,
        ipfsCid,
        docHash,
        issuedAt: new Date(),
        revoked: false,
        updatedAt: new Date(),
      },
    });

    // ✅ Khóa kết quả thi
    await prisma.examResult.update({
      where: { id: result.id },
      data: { locked: true },
    });

    // 🧾 Audit log for certificate issued
    await logAudit({
      actorId: user.id,
      action: "CERTIFICATE_ISSUED",
      entity: "Certificate",
      entityId: cert.id.toString(),
      payload: { examResultId: result.id },
    });

    return NextResponse.json({
      message: "🎓 Đã cấp chứng chỉ thành công",
      data: cert,
    });
  } catch (err) {
    console.error("❌ propose-certificate error:", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi cấp chứng chỉ" },
      { status: 500 }
    );
  }
}
