"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Copy, Search, Sparkles, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [revoked, setRevoked] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);

  const apiUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (courseId) p.set("courseId", courseId);
    if (revoked) p.set("revoked", revoked);
    p.set("page", "1");
    p.set("pageSize", "100");
    return `/api/admin/certificates?${p.toString()}`;
  }, [q, courseId, revoked]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => mounted && setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => mounted && setError("Không thể tải danh sách chứng chỉ"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/courses");
      const j = await r.json();
      setCourses(j.data || j);
    })();
  }, []);

  const reload = async () => {
    try {
      setLoading(true);
      const r = await fetch(apiUrl);
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
    } finally {
      setLoading(false);
    }
  };

  const revokeCert = async (id: number) => {
    try {
      const r = await fetch(`/api/admin/certificates/${id}/revoke`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Revoked by admin" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "REVOKE_FAILED");
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, revoked: true, revocationTxHash: j.txHash || it.revocationTxHash } : it))
      );
      toast.success("Đã thu hồi chứng chỉ.");
    } catch (e) {
      toast.error("Thu hồi thất bại.");
    }
  };

  const statusBadge = (c: any) => {
    const status = c.status || (c.revoked ? "REVOKED" : "ISSUED");
    if (status === "REVOKED")
      return <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 text-xs font-medium">Đã thu hồi</span>;
    if (status === "PENDING")
      return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 text-xs font-medium">Đang mint</span>;
    return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium">Đang hiệu lực</span>;
  };

  const truncateHash = (h?: string) => {
    if (!h || typeof h !== "string" || h.length < 10) return h || "—";
    return `${h.slice(0, 6)}...${h.slice(-4)}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép TxHash");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full max-w-[1920px] mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Kho chứng chỉ NFT</h1>
          <p className="text-sm text-gray-600">Quản lý, tra cứu và thu hồi chứng chỉ kỹ thuật số</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo Tên, Token ID hoặc TxHash..."
                  className="pl-10 bg-white"
                />
              </div>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="rounded-md border border-gray-200 bg-white text-gray-800 px-3 py-2"
              >
                <option value="">Tất cả khóa học</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title} (#{c.id})
                  </option>
                ))}
              </select>
              <select
                value={revoked}
                onChange={(e) => setRevoked(e.target.value)}
                className="rounded-md border border-gray-200 bg-white text-gray-800 px-3 py-2"
              >
                <option value="">Trạng thái</option>
                <option value="false">Đang hiệu lực</option>
                <option value="true">Đã thu hồi</option>
              </select>
            </div>
            <Link href="/admin/exams">
              <Button className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 text-white inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Cấp chứng chỉ mới
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4 text-gray-500">Đang tải...</div>
          ) : error ? (
            <div className="p-4 text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-gray-600">Không có chứng chỉ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Học viên</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Khóa học</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">NFT Info</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Ngày cấp</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c: any) => {
                    const name = c.user?.name || `User #${c.userId}`;
                    const email = c.user?.email || "—";
                    const initial = String(name || "U").trim().charAt(0).toUpperCase();
                    const courseTitle = c.course?.title || `Khoá #${c.courseId}`;
                    const issuedAt = c.issuedAt ? new Date(c.issuedAt).toLocaleString("vi-VN") : "—";
                    const tokenId = c.tokenId || "—";
                    const txHash = c.issueTxHash || c.revocationTxHash || "";
                    const explorerTokenUrl = c.tokenId ? `https://testnet.vicscan.xyz/token/${c.tokenId}` : "";
                    const pdfUrl = c.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${c.ipfsCid}` : `/cdn/cert/${c.id}.pdf`;
                    return (
                      <tr key={c.id} className="border-t border-gray-200 hover:bg-blue-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                              {initial}
                            </div>
                            <div>
                              <div className="text-gray-900 font-medium">{name}</div>
                              <div className="text-xs text-gray-500">{email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2 py-1 rounded">
                            {courseTitle}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-1 rounded">
                              #{tokenId}
                            </span>
                            <span className="font-mono text-gray-700 text-xs">{truncateHash(txHash)}</span>
                            {txHash ? (
                              <button
                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                                onClick={() => handleCopy(txHash)}
                                title="Copy TxHash"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-800">{issuedAt}</td>
                        <td className="px-4 py-3">{statusBadge(c)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {explorerTokenUrl ? (
                              <a
                                href={explorerTokenUrl}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Xem trên Chain
                              </a>
                            ) : null}
                            <a
                              href={pdfUrl}
                              download
                              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                            >
                              <Download className="w-4 h-4" />
                              Tải PDF
                            </a>
                            {!c.revoked ? (
                              <button
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                                onClick={() => revokeCert(c.id)}
                              >
                                <ShieldOff className="w-4 h-4" />
                                Thu hồi
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
