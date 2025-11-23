"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Hash, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 24;

function CertificatesPublicContent() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get("page") || "1"));
  const q = (params.get("q") || "").trim();
  const status = (params.get("status") || "").trim() as "" | "VALID" | "REVOKED";
  const [aiResults, setAiResults] = useState<Array<{ tokenId: string; courseTitle: string; userName: string | null; similarity_score: number }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResults, setPdfResults] = useState<Array<{ tokenId: string; courseTitle: string; userName: string | null; similarity_score: number }>>([]);
  const debounceRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public", "certificates", { page, q, status }],
    queryFn: async () => {
      const url = new URL("/api/certificates", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("fetch certificates failed");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const setParam = (kv: Record<string, string | null>) => {
    const qs = new URLSearchParams(params.toString());
    Object.entries(kv).forEach(([k, v]) => (v === null ? qs.delete(k) : qs.set(k, v)));
    router.push(`/cert?${qs.toString()}`);
  };

  useEffect(() => {
    if (!q) {
      setAiResults([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setAiLoading(true);
        const base = (process.env.NEXT_PUBLIC_AI_BASE_URL || "http://localhost:8002") as string;
        const url = `${base.replace(/\/$/, "")}/certificates/ai-search?query=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => []);
        setAiResults(Array.isArray(data) ? data : []);
      } catch {
        setAiResults([]);
      } finally {
        setAiLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8 bg-[#111318] text-white">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Danh sách chứng chỉ</h1>
          <p className="text-white/60 text-sm">Tìm bằng từ khóa hoặc file PDF để hệ thống tự nhận diện.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white placeholder-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-72"
            placeholder="Tìm theo tên khóa, token, IPFS"
            defaultValue={q}
            onChange={(e) => setParam({ q: (e.target as HTMLInputElement).value, page: "1" })}
          />
          <select
            className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={status}
            onChange={(e) => setParam({ status: e.target.value || "", page: "1" })}
            aria-label="Lọc trạng thái"
          >
            <option value="">Tất cả</option>
            <option value="VALID">VALID</option>
            <option value="REVOKED">REVOKED</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setPdfLoading(true);
                toast.loading("Đang tìm kiếm bằng file PDF...", { id: "ai-pdf" });
                const base = (process.env.NEXT_PUBLIC_AI_BASE_URL || "http://localhost:8002") as string;
                const url = `${base.replace(/\/$/, "")}/certificates/ai-search-pdf`;
                const reader = new FileReader();
                reader.onload = async () => {
                  const dataUrl = reader.result as string;
                  const b64 = (dataUrl.split(",")[1] || "");
                  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pdfBase64: b64 }) });
                  const data = await res.json().catch(() => []);
                  setPdfResults(Array.isArray(data) ? data : []);
                  if (Array.isArray(data) && data.length > 0) {
                    toast.success("Đã tìm thấy kết quả, đang mở...", { id: "ai-pdf" });
                    router.push(`/cert/${data[0].tokenId}`);
                  } else {
                    toast.info("Không có kết quả AI phù hợp", { id: "ai-pdf" });
                  }
                  setPdfLoading(false);
                };
                reader.onerror = () => {
                  setPdfResults([]);
                    toast.error("Đọc PDF thất bại", { id: "ai-pdf" });
                  setPdfLoading(false);
                };
                reader.readAsDataURL(f);
              } catch {
                setPdfResults([]);
                toast.error("Lỗi khi gửi PDF đến AI", { id: "ai-pdf" });
              } finally {
              }
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md"
            >
            Tìm kiếm bằng file PDF
          </Button>
          {pdfLoading && (
            <span className="text-xs text-indigo-300">Đang tìm kiếm bằng file PDF...</span>
          )}
        </div>
      </div>
          {pdfLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : pdfResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pdfResults.map((it) => (
                <div key={it.tokenId} className="rounded-2xl border border-[#3b4354] bg-[#1c1f27] p-5 hover:border-indigo-500/50 hover:bg-[#242833] hover:shadow-lg hover:shadow-black/20 transition">
                  <div className="flex items-start justify-between">
                    <div className="text-white font-semibold text-base">{it.courseTitle}</div>
                    <span className="text-xs rounded px-2 py-0.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/40">AI</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[#9da6b9]">
                    <div className="flex items-center gap-2"><Hash className="h-3 w-3" />Token: {it.tokenId}</div>
                    <div>Học viên: {it.userName || "—"}</div>
                    <div>Score: {it.similarity_score.toFixed(3)}</div>
                  </div>
                  <div className="mt-3 text-indigo-300 text-sm">Xem chi tiết →</div>
                </div>
              ))}
            </div>
          ) : q ? (
            aiLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : aiResults.length === 0 ? (
              <p className="py-6 text-sm text-white/70">Không có kết quả AI phù hợp.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {aiResults.map((it) => (
                  <div key={it.tokenId} className="rounded-2xl border border-[#3b4354] bg-[#1c1f27] p-5 hover:border-indigo-500/50 hover:bg-[#242833] hover:shadow-lg hover:shadow-black/20 transition">
                    <div className="flex items-start justify-between">
                      <div className="text-white font-semibold text-base">{it.courseTitle}</div>
                      <span className="text-xs rounded px-2 py-0.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/40">AI</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-[#9da6b9]">
                      <div className="flex items-center gap-2"><Hash className="h-3 w-3" />Token: {it.tokenId}</div>
                      <div>Học viên: {it.userName || "—"}</div>
                      <div>Score: {it.similarity_score.toFixed(3)}</div>
                    </div>
                    <div className="mt-3 text-indigo-300 text-sm">Xem chi tiết →</div>
                  </div>
                ))}
              </div>
            )
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Đã có lỗi xảy ra.</AlertTitle>
              <AlertDescription>
                <Button variant="link" onClick={() => refetch()}>Thử lại</Button>
              </AlertDescription>
            </Alert>
          ) : (data?.items?.length || 0) === 0 ? (
            <p className="py-6 text-sm text-white/70">Không có chứng chỉ phù hợp.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((it: any) => (
                <Link
                  key={it.tokenId}
                  href={`/cert/${it.tokenId}`}
                  className="rounded-2xl border border-[#3b4354] bg-[#1c1f27] p-5 hover:border-indigo-500/50 hover:bg-[#242833] hover:shadow-lg hover:shadow-black/20 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-white font-semibold text-base">{it.courseTitle}</div>
                    <span className={`text-xs rounded px-2 py-0.5 border ${it.status === "VALID" ? "bg-green-900/30 text-green-300 border-green-600/40" : "bg-red-900/30 text-red-300 border-red-600/40"}`}>{it.status}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[#9da6b9]">
                    <div className="flex items-center gap-2"><Hash className="h-3 w-3" />Token: {it.tokenId}</div>
                    <div className="flex items-center gap-2"><LinkIcon className="h-3 w-3" />IPFS: {it.ipfsCid}</div>
                  </div>
                  <div className="mt-3 text-indigo-300 text-sm">Xem chi tiết →</div>
                </Link>
              ))}
            </div>
          )}
    </main>
  );
}

export default function CertificatesPublicPage() {
  return (
    <Suspense fallback={<main className="p-6 bg-[#111318] text-white">Đang tải...</main>}>
      <CertificatesPublicContent />
    </Suspense>
  );
}
