"use client";
import { useState } from "react";

interface DedupItem {
  certId: string;
  pdfBase64: string;
  studentName: string;
  dob: string;
  course: string;
}

export interface DedupResult {
  certId: string;
  similarityScore: number;
  status: string;
  matchedWith: any[];
}

export function useDedupCheck() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DedupResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkCertificates(items: DedupItem[]) {
    setLoading(true);
    setError(null);
    try {
      console.log("🧩 Sending items to AI service:", items);

      const res = await fetch("http://localhost:8001/api/admin/certificates/ai-dedup-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          options: {
            topK: 3,
            thresholdUnique: 0.8,
            thresholdDuplicate: 0.95,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("🧠 AI DEDUP RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.error || "AI_DEDUP_FAILED");
      }

      if (!data.results) {
        throw new Error("Không nhận được kết quả từ dịch vụ AI");
      }

      setResults(data.results);
    } catch (err: any) {
      console.error("❌ AI check failed:", err);
      setError(err.message || "Lỗi không xác định");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return { loading, results, error, checkCertificates };
}
