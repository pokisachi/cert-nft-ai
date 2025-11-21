import { renderCertificateLatex } from "@/app/lib/pdf/renderCertificateLatex";

export async function renderLatexFinal(params: any) {
  // params sẽ chứa { data, mode }
  
  // Map từ cảm dữ liệu cũ sang tên variable renderer đang dùng
  const latexData = {
    STUDENT_NAME: params.data.student_name || "",
    STUDENT_DOB: params.data.dob || "",
    COURSE_TITLE: params.data.course_title || "",
    EXAM_SCORE: params.data.exam_score?.toString() || "",
    EXAM_STATUS: "PASS",
    COMPLETION_DATE: params.data.issue_date || "",
    CERTIFICATE_CODE: params.data.certificate_code || "",
    SIGNER_LEFT_NAME: params.data.issuer_name || "",
    SIGNER_LEFT_ROLE: "Issuer",
    SIGNER_RIGHT_NAME: "",
    SIGNER_RIGHT_ROLE: "",
    ISSUE_DATE: params.data.issue_date || "",
    PDF_TITLE: "Certificate",
    PDF_AUTHOR: "System",
    PDF_SUBJECT: "Certificate",
    PDF_KEYWORDS: "Certificate",
  };

  return renderCertificateLatex(latexData);
}
