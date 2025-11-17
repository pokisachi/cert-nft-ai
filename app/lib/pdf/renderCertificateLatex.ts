import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const templatePath = path.join(process.cwd(), "app/lib/pdf/template.tex");

// Escape ký tự LaTeX
function escapeLatex(str: string) {
  if (!str) return "";
  return str
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\~{}")
    .replace(/\\/g, "\\textbackslash ");
}

export async function renderCertificateLatex(latexData: Record<string, string>) {
  try {
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    // --- QR disable ---
    const qrPath = "";

    // --- Logo ---
    const logoPath = path.join(tmpDir, `logo-${Date.now()}.png`);
    const logoRes = await fetch(process.env.LOGO_URL!);
    if (!logoRes.ok) throw new Error("Cannot fetch LOGO_URL");
    fs.writeFileSync(logoPath, Buffer.from(await logoRes.arrayBuffer()));

    // --- Background ---
    const bgSrc = path.join(process.cwd(), "app/lib/pdf/background.png");
    const bgDest = path.join(tmpDir, "background.png");
    fs.copyFileSync(bgSrc, bgDest);

    // --- Template ---
    let tex = fs.readFileSync(templatePath, "utf8");

    const vars: Record<string, string> = {
      LOGO_SRC: logoPath,
      QR_CODE: qrPath,
      STUDENT_NAME: escapeLatex(latexData.STUDENT_NAME),
      STUDENT_DOB: escapeLatex(latexData.STUDENT_DOB),
      COURSE_TITLE: escapeLatex(latexData.COURSE_TITLE),
      EXAM_SCORE: escapeLatex(latexData.EXAM_SCORE),
      EXAM_STATUS: escapeLatex(latexData.EXAM_STATUS),
      COMPLETION_DATE: escapeLatex(latexData.COMPLETION_DATE),
      CERTIFICATE_CODE: escapeLatex(latexData.CERTIFICATE_CODE),
      SIGNER_LEFT_NAME: escapeLatex(latexData.SIGNER_LEFT_NAME),
      SIGNER_LEFT_ROLE: escapeLatex(latexData.SIGNER_LEFT_ROLE),
      SIGNER_RIGHT_NAME: escapeLatex(latexData.SIGNER_RIGHT_NAME),
      SIGNER_RIGHT_ROLE: escapeLatex(latexData.SIGNER_RIGHT_ROLE),
      ISSUE_DATE: escapeLatex(latexData.ISSUE_DATE),
      PDF_TITLE: escapeLatex(latexData.PDF_TITLE),
      PDF_AUTHOR: escapeLatex(latexData.PDF_AUTHOR),
      PDF_SUBJECT: escapeLatex(latexData.PDF_SUBJECT),
      PDF_KEYWORDS: escapeLatex(latexData.PDF_KEYWORDS),
    };

    for (const k in vars) {
      tex = tex.replaceAll(`{{${k}}}`, vars[k]);
    }

    const texPath = path.join(tmpDir, `cert-${Date.now()}.tex`);
    fs.writeFileSync(texPath, tex);

    execSync(
      `lualatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texPath}"`,
      { stdio: "pipe" }

    );
    

    const pdfPath = texPath.replace(".tex", ".pdf");
    const pdfBuffer = fs.readFileSync(pdfPath);

    const preIssueHash = crypto
      .createHash("sha256")
      .update(pdfBuffer)
      .digest("hex");

    return { pdfBuffer, preIssueHash };
} catch (err: any) {
  console.error("LATEX ERROR STDOUT:", err.stdout?.toString());
  console.error("LATEX ERROR STDERR:", err.stderr?.toString());
  throw new Error("LATEX_RENDER_FAILED");
}

}
