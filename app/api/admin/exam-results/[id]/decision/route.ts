import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { aiDedupClient } from "@/lib/aiDedupClient";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

// Mock function to generate certificate text preview
// In a real implementation, this would generate the actual certificate content
function generateCertificateTextPreview(result: any): string {
  return `Chứng chỉ hoàn thành khóa học ${result.examSession.course.title} tại Trung tâm Đào tạo Quốc tế. Học viên: ${result.user.name}, Ngày sinh: ${result.user.dob ? new Date(result.user.dob).toLocaleDateString('vi-VN') : 'N/A'}, ${result.user.idcard ? `CMND: ${result.user.idcard}` : ''}, Khóa học: ${result.examSession.course.title}, Ngày thi: ${result.examSession.date ? new Date(result.examSession.date).toLocaleDateString('vi-VN') : 'N/A'}, Điểm: ${result.score}, Xếp loại: ${result.status}. Chứng chỉ có giá trị 2 năm kể từ ngày cấp.`;
}

export async function POST(
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

    if (result.locked) {
      return NextResponse.json({ error: "Result locked after certificate issuance" }, { status: 409 });
    }

    const body = await req.json();
    const { decision, note } = body;

    if (!decision || (decision !== "ALLOW" && decision !== "BLOCK")) {
      return NextResponse.json({ error: "Quyết định không hợp lệ. Phải là ALLOW hoặc BLOCK" }, { status: 400 });
    }

    // 📄 Generate certificate text preview for dedup check
    const certificateTextPreview = generateCertificateTextPreview(result);
    const docHash = crypto.createHash('sha256').update(certificateTextPreview).digest('hex');

    // 🤖 Record decision with AI service
    try {
      await aiDedupClient.decision(
        docHash, // Using docHash as checkId for simplicity
        decision,
        user.name || user.email || user.id.toString(),
        note
      );
    } catch (error) {
      console.error("❌ AI Dedup decision recording error:", error);
      // Continue even if AI service is unavailable
    }

    if (decision === "BLOCK") {
      // 🚫 Block certificate issuance
      await logAudit({
        actorId: user.id,
        action: "AI_DEDUP_BLOCKED",
        entity: "ExamResult",
        entityId: result.id.toString(),
        payload: { decision, note, docHash },
      });

      return NextResponse.json({
        message: "Đã từ chối cấp chứng chỉ theo quyết định của admin",
      });
    }

    // ✅ Allow certificate issuance
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

    // 🧾 Audit log for override
    await logAudit({
      actorId: user.id,
      action: "AI_DEDUP_OVERRIDE",
      entity: "Certificate",
      entityId: cert.id.toString(),
      payload: { examResultId: result.id, decision, note },
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
    console.error("❌ decision error:", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi xử lý quyết định" },
      { status: 500 }
    );
  }
}
