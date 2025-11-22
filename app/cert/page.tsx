"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 24;

function CertificatesPublicContent() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get("page") || "1"));
  const q = (params.get("q") || "").trim();
  const status = (params.get("status") || "").trim() as "" | "VALID" | "REVOKED";

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

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Danh sách chứng chỉ</CardTitle>
          <div className="flex items-center gap-2">
            <input
              className="rounded-md border px-2 py-1 text-sm"
              placeholder="Tìm theo tên khóa, token, IPFS"
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key === "Enter") setParam({ q: (e.target as HTMLInputElement).value, page: "1" });
              }}
            />
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setParam({ status: e.target.value || "", page: "1" })}
              aria-label="Lọc trạng thái"
            >
              <option value="">Tất cả</option>
              <option value="VALID">VALID</option>
              <option value="REVOKED">REVOKED</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="py-6 text-sm text-gray-600">Không có chứng chỉ phù hợp.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((it: any) => (
                <Link
                  key={it.tokenId}
                  href={`/cert/${it.tokenId}`}
                  className="rounded border bg-white p-4 hover:shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-800">{it.courseTitle}</div>
                    <span className={`text-xs rounded px-2 py-0.5 ${it.status === "VALID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{it.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">Token: {it.tokenId}</div>
                  <div className="mt-1 text-xs text-gray-600">IPFS: {it.ipfsCid}</div>
                  <div className="mt-2 text-indigo-600 text-sm">Xem chi tiết →</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function CertificatesPublicPage() {
  return (
    <Suspense fallback={<main className="p-6">Đang tải...</main>}>
      <CertificatesPublicContent />
    </Suspense>
  );
}