import fs from "fs";
import path from "path";
import crypto from "crypto"; // ✅ Thêm dòng này để fix lỗi createHash
import puppeteer from "puppeteer";

/**
 * Render PDF chứng chỉ từ template HTML
 * Tự động chèn logo (base64 fallback)
 */
export async function renderCertificatePDF(ctx: Record<string, string>) {
  // 🔹 Đường dẫn template (vì bạn đặt trong app/lib/pdf)
  const templatePath = path.join(process.cwd(), "app/lib/pdf/template.html");

  // 🔹 Đọc file HTML gốc
  let html = await fs.promises.readFile(templatePath, "utf-8");

  // 🔹 Thêm logo base64 fallback
  const logoPath = path.join(process.cwd(), "public/assets/logo.png");
  let logoBase64: string | null = null;

  try {
    const data = await fs.promises.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    console.warn("⚠️ Không tìm thấy logo.png — sẽ bỏ qua logo");
  }

  // 🔹 Thay các placeholder {{KEY}} trong HTML bằng dữ liệu thật
  const replacements = {
    ...ctx,
    LOGO_SRC: logoBase64 || "/assets/logo.png",
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, value ?? "");
  }

  // 🔹 Khởi tạo Puppeteer headless
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Load nội dung HTML
  await page.setContent(html, { waitUntil: "networkidle0" });

  // ✅ Xuất PDF chuẩn A4, căn full
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  await browser.close();

  // ✅ Tạo hash để xác minh PDF (chống giả)
  const preIssueHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

  return { pdfBuffer, preIssueHash };
}
