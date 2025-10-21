import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// ✅ Hàm xác định ngưỡng đậu theo tên và danh mục khóa học
function getPassScore(course: { title: string; category: string }) {
  const title = (course.title || "").toLowerCase().trim();
  const category = (course.category || "").toLowerCase().trim();

  // 🧩 1️⃣ TOEIC — ví dụ: "toeic 900+", "toeic900+", "toeic 450", "toeic 650+"
  if (title.includes("toeic") || category.includes("toeic")) {
    // Lấy số đầu tiên xuất hiện trong chuỗi (2 hoặc 3 chữ số)
    const match = title.match(/toeic\s*(\d{2,3})\s*\+?/i);
    if (match && match[1]) {
      const level = parseInt(match[1]);
      if (!isNaN(level)) return level; // PASS nếu >= level
    }
    // Nếu không bắt được số thì mặc định 250
    return 250;
  }

  // 💻 2️⃣ Tin học (thang 10 điểm)
  if (title.includes("tin học") || category.includes("tin học")) {
    return 5; // PASS nếu >= 5
  }

  // 📘 3️⃣ Các khóa học khác (thang 100)
  return 50; // PASS nếu >= 50
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

    // ✅ Next.js 15 yêu cầu await context.params
    const { id } = await context.params;
    const resultId = Number(id);
    if (isNaN(resultId)) {
      return NextResponse.json(
        { error: "Mã kết quả thi không hợp lệ" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const score = Number(body.score);
    if (isNaN(score)) {
      return NextResponse.json({ error: "Điểm không hợp lệ" }, { status: 400 });
    }

    // 🔍 Lấy kết quả thi và thông tin khóa học
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        examSession: { include: { course: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Không tìm thấy kết quả thi" }, { status: 404 });
    }

    const course = result.examSession.course;
    const passScore = getPassScore(course);
    const newStatus = score >= passScore ? "PASS" : "FAIL";

    console.log(
      `📘 [ExamResult] Course: ${course.title} | Category: ${course.category} | Score: ${score} | Pass >= ${passScore} | Status: ${newStatus}`
    );

    // ✅ Cập nhật điểm và trạng thái
    const updated = await prisma.examResult.update({
      where: { id: resultId },
      data: { score, status: newStatus },
    });

    return NextResponse.json({
      message: `Cập nhật điểm thi thành công (${newStatus})`,
      data: updated,
    });
  } catch (err) {
    console.error("❌ PATCH /exam-results/[id] error:", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lưu điểm" },
      { status: 500 }
    );
  }
}
