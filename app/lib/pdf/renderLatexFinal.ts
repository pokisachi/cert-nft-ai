// app/lib/pdf/latex/renderLatexFinal.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export type FinalLatexInput = {
  data: {
    student_name: string;
    dob: string;
    course_title: string;
    exam_score: number;
    issue_date: string;        // yyyy-mm-dd
    certificate_code: string;
    issuer_name: string;
    verify_url: string;        // base URL / hoặc URL xác minh
    tokenId?: string | number; // hiện tại chưa có cũng không sao
  };
  mode?: "final";
};

export async function renderLatexFinal(
  input: FinalLatexInput
): Promise<{ pdfBuffer: Buffer }> {
  const { data } = input;

  // Tạo PDF A4
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  // ===== 1. Nền (background PNG giống UI) =====
  // Đặt file cert-bg.png trong: app/lib/pdf/cert-bg.png
  const bgPath = path.join(process.cwd(), "app", "lib", "pdf", "cert-bg.png");
  const bgBytes = fs.readFileSync(bgPath);
  const bgImage = await pdfDoc.embedPng(bgBytes);

  const bgScale = Math.min(
    width / bgImage.width,
    height / bgImage.height
  );
  const bgWidth = bgImage.width * bgScale;
  const bgHeight = bgImage.height * bgScale;

  page.drawImage(bgImage, {
    x: (width - bgWidth) / 2,
    y: (height - bgHeight) / 2,
    width: bgWidth,
    height: bgHeight,
  });

  // ===== 2. Font =====
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const centerX = width / 2;

  // Helper để vẽ text canh giữa
  const drawCenteredText = (text: string, y: number, size: number, bold = false) => {
    const font = bold ? fontBold : fontRegular;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: centerX - textWidth / 2,
      y,
      size,
      font,
      color: rgb(0.1, 0.1, 0.2),
    });
  };

  // ===== 3. Nội dung chứng chỉ =====

  // Title
  drawCenteredText("CERTIFICATE OF COMPLETION", height - 220, 12, true);

  // "Trao cho"
  drawCenteredText("Trao cho", height - 250, 10, false);

  // Tên học viên
  drawCenteredText(data.student_name, height - 280, 18, true);

  // "Đã hoàn thành khóa học"
  drawCenteredText("Đã hoàn thành khóa học", height - 310, 10);

  // Tên khoá học
  drawCenteredText(data.course_title, height - 330, 12, true);

  // Điểm số + ngày cấp (dưới một chút)
  const infoSize = 9;
  page.drawText(`Điểm thi / Score: ${data.exam_score}`, {
    x: centerX - 120,
    y: height - 370,
    size: infoSize,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.25),
  });

  page.drawText(`Ngày cấp / Issue date: ${data.issue_date}`, {
    x: centerX - 120,
    y: height - 390,
    size: infoSize,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.25),
  });

  // Mã chứng chỉ + Blockchain ở chân trang (góc trái/phải)
  const footerY = 70;
  page.drawText("Mã chứng chỉ", {
    x: 80,
    y: footerY + 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.6),
  });
  page.drawText(`#${data.certificate_code}`, {
    x: 80,
    y: footerY,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.2),
  });

  page.drawText("Blockchain", {
    x: width - 160,
    y: footerY + 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.6),
  });
  page.drawText("Chain 89", {
    x: width - 160,
    y: footerY,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.2),
  });

  // (Tuỳ chọn sau này: thêm QR code ở cạnh con huy chương)

  // Xuất PDF
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return { pdfBuffer: buffer };
}
