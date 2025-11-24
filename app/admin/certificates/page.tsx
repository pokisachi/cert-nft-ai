"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const grouped = useMemo(() => {
    const map = new Map<number, { courseId: number; courseTitle: string; list: any[] }>();
    items.forEach((c) => {
      const id = Number(c.courseId);
      const title = c.course?.title || `Khoá #${id}`;
      const existing = map.get(id);
      const g: { courseId: number; courseTitle: string; list: any[] } = existing ?? {
        courseId: id,
        courseTitle: title,
        list: [] as any[],
      };
      g.list.push(c as any);
      map.set(id, g);
    });
    return Array.from(map.values()).sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
  }, [items]);

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
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, revoked: true, revocationTxHash: j.txHash || it.revocationTxHash } : it)));
    } catch (e) {}
  };

  const writeOnchain = async (c: any) => {
    try {
      const r = await fetch(`/api/admin/certificates/${c.id}/revoke`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Write on-chain revoke", tokenId: c.tokenId, onchain: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "ONCHAIN_REVOKE_FAILED");
      setItems((prev) => prev.map((it) => (
        it.id === c.id
          ? { ...it, revocationTxHash: j.txHash || it.revocationTxHash, revocationError: j.onchainError || null }
          : it
      )));
      await reload();
    } catch (e) {}
  };

  return (
    <main className="p-6 bg-[#111318] min-h-[calc(100vh-64px)] text-white">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Quản lý chứng chỉ</h1>

        <Card variant="dark" className="border-[#3b4354]">
          <CardContent className="p-4 flex flex-wrap gap-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, tokenId, ipfsCid"
              className="border border-[#3b4354] bg-[#12151b] text-white w-64"
            />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2"
            >
              <option value="">Tất cả khóa</option>
              {courses.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title} (#{c.id})
                </option>
              ))}
            </select>
            <select
              value={revoked}
              onChange={(e) => setRevoked(e.target.value)}
              className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="false">Chưa thu hồi</option>
              <option value="true">Đã thu hồi</option>
            </select>
            <Button onClick={reload} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Làm mới</Button>
          </CardContent>
        </Card>

        {loading ? (
          <Card variant="dark" className="border-[#3b4354]">
            <CardContent className="p-4 text-[#9da6b9]">Đang tải...</CardContent>
          </Card>
        ) : error ? (
          <Card variant="dark" className="border-[#3b4354]">
            <CardContent className="p-4 text-red-400">{error}</CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card variant="dark" className="border-[#3b4354]">
            <CardContent className="p-4 text-[#9da6b9]">Không có chứng chỉ</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <Card key={g.courseId} variant="dark" className="border-[#3b4354]">
                <CardHeader className="border-b border-[#3b4354]">
                  <CardTitle className="text-white">
                    {g.courseTitle} — {g.list.length} chứng chỉ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-[#1c1f27] text-[#9da6b9]">
                          <th className="text-left px-4 py-2">Học viên</th>
                          <th className="text-left px-4 py-2">Token</th>
                          <th className="text-left px-4 py-2">Issued</th>
                          <th className="text-left px-4 py-2">Trạng thái</th>
                          <th className="text-left px-4 py-2">Tx thu hồi</th>
                          <th className="text-left px-4 py-2">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.list.map((c) => (
                          <tr key={c.id} className="border-t border-[#3b4354]">
                            <td className="px-4 py-2">
                              {c.user?.name || `User #${c.userId}`}
                            </td>
                            <td className="px-4 py-2">{c.tokenId}</td>
                            <td className="px-4 py-2">
                              {c.issuedAt ? new Date(c.issuedAt).toLocaleString("vi-VN") : "—"}
                            </td>
                            <td className="px-4 py-2">
                              {c.revoked ? (
                                <span className="px-2 py-1 rounded bg-red-900/30 text-red-300 border border-red-700/40">Đã thu hồi</span>
                              ) : (
                                <span className="px-2 py-1 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/40">Đang hiệu lực</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {c.revocationTxHash ? (
                                <a
                                  href={`https://testnet.vicscan.xyz/tx/${c.revocationTxHash}`}
                                  target="_blank"
                                  className="underline text-indigo-300"
                                >
                                  Xem giao dịch
                                </a>
                              ) : c.revocationError ? (
                                <span className="text-red-400">{c.revocationError}</span>
                              ) : (
                                <span className="text-[#9da6b9]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {c.revoked ? (
                                c.revocationTxHash ? (
                                  <Button variant="outline" className="border-[#3b4354] text-white" disabled>
                                    Đã thu hồi
                                  </Button>
                                ) : (
                                  <Button
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => writeOnchain(c)}
                                  >
                                    Ghi on-chain
                                  </Button>
                                )
                              ) : (
                                <Button
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => revokeCert(c.id)}
                                >
                                  Thu hồi
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
