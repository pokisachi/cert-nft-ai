// app/admin/exams/[sessionId]/results/hooks/useIssue.ts
"use client";
import { useState } from "react";

export function useIssue() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cấp NFT cho 1 examResult theo pipeline: render → AI save → issue-final
  async function issueFinal(
    examResultId: number,
    opts?: { certificate_code?: string; issuer_name?: string; issue_date?: string }
  ) {
    setLoading(true);
    setError(null);
    try {
      const issueDate = opts?.issue_date || new Date().toISOString().slice(0, 10);
      const certificateCode = opts?.certificate_code || `BF-${new Date().getFullYear()}-${examResultId}`;
      const issuerName = opts?.issuer_name || "UNET.edu.vn";

      const renderRes = await fetch("/api/certificates/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examResultId,
          issue_date: issueDate,
          certificate_code: certificateCode,
          issuer_name: issuerName,
        }),
      });
      const renderData = await renderRes.json();
      if (!renderRes.ok) {
        setLoading(false);
        setError(renderData?.code || "RENDER_FAILED");
        throw new Error(renderData?.code || "render_failed");
      }

      const preIssueHash: string = renderData.preIssueHash;
      const pdfPreviewBase64: string = renderData.pdf?.base64 || "";

      await fetch("/api/internal/ai/check-and-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examResultId, pdfPreviewBase64 }),
      }).catch(() => {});

      const r = await fetch("/api/certificates/issue-final", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          examResultId,
          issue_date: issueDate,
          certificate_code: certificateCode,
          issuer_name: issuerName,
          preIssueHash,
        }),
      });
      const data = await r.json();
      setLoading(false);
      if (!r.ok) {
        setError(data?.error || "ISSUE_FINAL_FAILED");
        throw new Error(data?.error || "fail");
      }
      setResult(data);
      return data;
    } catch (e: any) {
      setLoading(false);
      if (!error) setError(e?.message || "ISSUE_PIPELINE_FAILED");
      throw e;
    }
  }

  // Cấp NFT cho cả session (batch)
  async function issueBatch(sessionId: number) {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/certificates/issue-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(data?.error || "ISSUE_BATCH_FAILED");
      throw new Error(data?.error || "fail");
    }
    setResult(data);
    return data;
  }

  return { loading, result, error, issueFinal, issueBatch };
}
