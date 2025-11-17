import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { renderCertificateLatex } from "@/app/lib/pdf/renderCertificateLatex";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------
// Format ngày đúng chuẩn YYYY-MM-DD cho LaTeX
// ---------------------------------------------------------
function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
}

// ---------------------------------------------------------
// POST /api/certificates/render
// ---------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ---------------------------------
    // Validate tổi thiểu
    // ---------------------------------
    if (!body.examResultId || !body.issue_date) {
      return NextResponse.json({ code: "VALIDATION_FAILED" }, { status: 400 });
    }

    const er = await prisma.examResult.findUnique({
      where: { id: body.examResultId },
      include: {
        user: true,
        examSession: { include: { course: true } },
      },
    });

    if (!er || !er.user || !er.examSession?.course) {
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }

    if (er.status !== "PASS") {
      return NextResponse.json({ code: "NOT_PASS" }, { status: 400 });
    }

    const course = er.examSession.course;
    const category = (course.category ?? "").toUpperCase();

    // ---------------------------------
    // Profile hợp lệ
    // ---------------------------------
    let profile: "TOEIC" | "TINHOC";
    if (category === "TOEIC") profile = "TOEIC";
    else if (category === "TINHOC") profile = "TINHOC";
    else {
      return NextResponse.json(
        { code: "COURSE_CATEGORY_UNSUPPORTED" },
        { status: 400 }
      );
    }

    // ---------------------------------
    // Validate điểm
    // ---------------------------------
    const score = er.score ?? 0;

    if (profile === "TOEIC" && (score < 250 || score > 900)) {
      return NextResponse.json({ code: "SCORE_OUT_OF_RANGE" }, { status: 400 });
    }
    if (profile === "TINHOC" && (score < 0 || score > 10)) {
      return NextResponse.json({ code: "SCORE_OUT_OF_RANGE" }, { status: 400 });
    }

    // ---------------------------------
    // Chuẩn hoá dữ liệu
    // ---------------------------------
    const completionDate = er.examSession.date
      ? new Date(er.examSession.date)
      : null;

    const leftSigner = body.signers?.left ?? {};
    const rightSigner = body.signers?.right ?? {};

    const isFinal = body.mode === "final";

    // Nếu preview → verify_url = "" để không bị QR hoặc lỗi
    const verifyUrl = isFinal ? body.verify_url ?? "" : "";

    const sourceDateEpoch =
      body.source_date_epoch ?? body.options?.source_date_epoch ?? null;

    // ---------------------------------
    // Payload truyền vào LaTeX
    // ---------------------------------
    const latexPayload = {
      STUDENT_NAME: er.user.name ?? "",
      STUDENT_DOB: formatDate(er.user.dob ?? null),

      COURSE_TITLE: course.title ?? "",
      EXAM_SCORE: String(score),
      EXAM_STATUS: er.status ?? "PASS",

      COMPLETION_DATE: formatDate(completionDate),
      ISSUE_DATE: body.issue_date,

      CERTIFICATE_CODE: body.certificate_code ?? "",
      ISSUER_NAME: body.issuer_name ?? "",

      SIGNER_LEFT_NAME: leftSigner.name ?? "",
      SIGNER_LEFT_ROLE: leftSigner.role ?? "",
      SIGNER_RIGHT_NAME: rightSigner.name ?? "",
      SIGNER_RIGHT_ROLE: rightSigner.role ?? "",

      // Không dùng QR nhưng vẫn để phòng trường hợp thêm lại
      SHOW_QR: isFinal && verifyUrl ? "true" : "false",
      VERIFY_URL: verifyUrl,

      PDF_TITLE: `${course.title ?? "Certificate"} - ${
        er.user.name ?? ""
      }`.trim(),
      PDF_AUTHOR: body.issuer_name ?? "Cert Platform",
      PDF_SUBJECT: `${course.title ?? ""} Completion Certificate`,
      PDF_KEYWORDS: `${course.title ?? "certificate"},${profile}`,

      SOURCE_DATE_EPOCH: sourceDateEpoch,
    };

    // ---------------------------------
    // Render LaTeX → PDF
    // ---------------------------------
    const { pdfBuffer, preIssueHash } =
      await renderCertificateLatex(latexPayload);

    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // ---------------------------------
    // Lưu log
    // ---------------------------------
    await prisma.auditLog.create({
      data: {
        action: "CERT_RENDER_PREVIEW",
        entity: "ExamResult",
        entityId: er.id.toString(),
        payload: {
          examResultId: er.id,
          userId: er.userId,
          courseId: course.id,
          preIssueHash,
        },
      },
    });

    // ---------------------------------
    // OK
    // ---------------------------------
    return NextResponse.json({
      status: "ok",
      pdf: { url: null, base64: pdfBase64 },
      preIssueHash,
      metadata: {
        examResultId: er.id,
        userId: er.userId,
        courseId: course.id,
        profile,
      },
    });
  } catch (err) {
    console.error("CERT Render error:", err);
    return NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
