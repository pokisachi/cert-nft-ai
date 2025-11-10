import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { renderCertificatePDF } from '@/app/lib/pdf/renderCertificateHtml';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1️⃣ Validate đầu vào
    if (!body.examResultId || !body.issue_date) {
      return NextResponse.json({ code: 'VALIDATION_FAILED' }, { status: 400 });
    }

    // 2️⃣ Lấy dữ liệu từ DB
    const er = await prisma.examResult.findUnique({
      where: { id: body.examResultId },
      include: { user: true, examSession: { include: { course: true } } },
    });

    if (!er || !er.user || !er.examSession?.course) {
      return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
    }

    if (er.status !== 'PASS') {
      return NextResponse.json({ code: 'NOT_PASS' }, { status: 400 });
    }

    // 3️⃣ Phân loại theo khóa học
    const course = er.examSession.course;
    const cat = (course.category ?? '').toUpperCase();
    let profile: 'TOEIC' | 'TINHOC';
    if (cat === 'TOEIC') profile = 'TOEIC';
    else if (cat === 'TINHOC') profile = 'TINHOC';
    else {
      return NextResponse.json({ code: 'COURSE_CATEGORY_UNSUPPORTED' }, { status: 400 });
    }

    // 4️⃣ Kiểm tra điểm hợp lệ
    const score = er.score ?? 0;
    if (profile === 'TOEIC' && (score < 250 || score > 900)) {
      return NextResponse.json({ code: 'SCORE_OUT_OF_RANGE' }, { status: 400 });
    }
    if (profile === 'TINHOC' && (score < 0 || score > 10)) {
      return NextResponse.json({ code: 'SCORE_OUT_OF_RANGE' }, { status: 400 });
    }

    // 5️⃣ Chuẩn bị dữ liệu render
    const ctx = {
      STUDENT_NAME: er.user.name ?? '',
      STUDENT_DOB: er.user.dob ? er.user.dob.toISOString().split('T')[0] : '',
      COURSE_TITLE: course.title ?? '',
      EXAM_SCORE: String(score),
      EXAM_STATUS: er.status ?? 'PASS',                  // ✅ thêm
      COMPLETION_DATE: er.examSession.date
        ? new Date(er.examSession.date).toISOString().split('T')[0]
        : '',                                            // ✅ thêm
      ISSUE_DATE: body.issue_date,
      EXPIRY_DATE: body.expiry_date ?? '',
      CERTIFICATE_CODE: body.certificate_code ?? '',
      ISSUER_NAME: body.issuer_name ?? '',
      VERIFY_URL: '',                                    // (nếu có hệ verify thì truyền vào đây)
    };


    // 6️⃣ Render PDF
    const { pdfBuffer, preIssueHash } = await renderCertificatePDF(ctx);
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64'); // ✅ fixed

   // 7️⃣ Ghi log (tùy chọn)
await prisma.auditLog.create({
  data: {
    action: 'CERT_RENDER_PREVIEW',
    entity: 'ExamResult', // ✅ field hợp lệ
    entityId: er.id.toString(), // ✅ ép sang string vì entityId là String?
    payload: { // ✅ Prisma tự parse JSON
      examResultId: er.id,
      userId: er.userId,
      courseId: course.id,
      preIssueHash,
    },
  },
});

// 8️⃣ Trả kết quả JSON
return NextResponse.json({
  status: 'ok',
  pdf: { url: null, base64: pdfBase64 },
  preIssueHash,
  metadata: {
    examResultId: er.id,
    userId: er.userId,
    courseId: course.id,
    profile,
  },
});

  } catch (err: any) {
    console.error('❌ Render error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
