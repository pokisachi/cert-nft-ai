import { renderCertificateLatex } from "@/app/lib/pdf/renderCertificateLatex";

export async function renderLatexFinal(params: any) {
  return renderCertificateLatex(params);
}
