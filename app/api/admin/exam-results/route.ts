import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// ✅ Ngưỡng đậu theo khóa học (giữ nguyên logic bạn có)
function getPassScore(course: { title: string; category: string }) {
  const title = (course.title || "").toLowerCase().trim();
  const category = (course.category || "").toLowerCase().trim();

  if (title.includes("toeic") || category.includes("toeic")) {
    const match = title.match(/toeic\s*(\d{2,3})\s*\+?/i);
    if (match && match[1]) {
      const level = parseInt(match[1]);
      if (!isNaN(level)) return level;
    }
    return 250;
  }
  if (title.includes("tin học") || category.includes("tin học")) return 5;
  return 50;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện thao tác này" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const resultId = Number(id);
    if (isNaN(resultId))
      return NextResponse.json({ error: "Mã kết quả thi không hợp lệ" }, { status: 400 });

    const body = await req.json();
    const score =
      body.score === null || body.score === undefined
        ? null
        : Number(body.score);

    if (score !== null && (isNaN(score) || score < 0 || score > 990)) {
      return NextResponse.json({ error: "Điểm không hợp lệ" }, { status: 400 });
    }

    // 🔍 Lấy kết quả thi
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        examSession: { include: { course: true } },
        user: true,
      },
    });

    if (!result)
      return NextResponse.json({ error: "Không tìm thấy kết quả thi" }, { status: 404 });

    if (result.locked)
      return NextResponse.json(
        { error: "Result locked after certificate issuance" },
        { status: 409 }
      );

    // 🧮 Tính lại trạng thái & eligible
    const passScore = getPassScore(result.examSession.course);
    let newStatus: "PASS" | "FAIL" | "PENDING" = "PENDING";

    if (score == null) newStatus = "PENDING";
    else if (score >= passScore) newStatus = "PASS";
    else newStatus = "FAIL";

    const eligible =
      newStatus === "PASS" &&
      result.user?.dob != null &&
      result.examSession.date != null;

    // 📝 Ghi AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "RESULT_UPDATE",
        entity: "ExamResult",
        entityId: result.id.toString(),
        payload: {
          old: { score: result.score, status: result.status },
          new: { score, status: newStatus, eligible },
        },
      },
    });

    // ✅ Cập nhật điểm
    const updated = await prisma.examResult.update({
      where: { id: result.id },
      data: { score, status: newStatus },
    });

    return NextResponse.json({
      examResultId: updated.id,
      status: newStatus,
      eligible,
      locked: updated.locked,
    });
  } catch (err) {
    console.error("❌ PATCH /exam-results/[id] error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi lưu điểm" }, { status: 500 });
  }
}
