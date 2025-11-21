// app/admin/exams/[sessionId]/results/hooks/useIssue.ts
"use client";
import { useState } from "react";

export function useIssue() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cấp NFT cho 1 examResult
  async function issueFinal(examResultId: number) {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/certificates/issue-final", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        examResultId,
        issue_date: new Date().toISOString().slice(0, 10)
      })
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(data?.error || "ISSUE_FINAL_FAILED");
      throw new Error(data?.error || "fail");
    }
    setResult(data);
    return data;
  }

  // Cấp NFT cho cả session (batch)
  async function issueBatch(sessionId: number) {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/admin/certificates/issue-batch", {
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
