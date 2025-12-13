"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import { Download, Eye, Trash2, Copy } from "lucide-react";

type Learner = {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
  walletAddress?: string | null;
  createdAt: string;
};

type LearnerListResponse = {
  items: Learner[];
  page: number;
  size: number;
  total: number;
};

type Course = { id: number; title: string };

export default function LearnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");

  const { data, isLoading, refetch } = useQuery<LearnerListResponse>({
    queryKey: ["learners", page, search],
    queryFn: () =>
      fetcher<LearnerListResponse>(
        `/api/admin/learners?page=${page}&search=${encodeURIComponent(search)}`
      ),
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/courses?page=1&size=50`);
        const json = await res.json();
        const arr = Array.isArray(json?.data) ? json.data : [];
        setCourses(arr.map((c: any) => ({ id: c.id, title: c.title })));
      } catch (e) {}
    })();
  }, []);

  const handleSearch = async () => {
    setPage(1);
    setSearch(searchTerm.trim());
    await new Promise((r) => setTimeout(r, 10));
    refetch();
  };

  const shorten = (addr?: string | null) => {
    if (!addr) return "";
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const initials = (name?: string | null) => {
    const s = (name || "?").trim();
    return s ? s[0].toUpperCase() : "?";
  };

  const items = useMemo(() => data?.items || [], [data]);
  const totalPages = useMemo(() => Math.ceil((data?.total || 0) / (data?.size || 10)) || 1, [data]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 text-gray-600 p-10">
        Đang tải danh sách học viên...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-black">Quản lý học viên</h1>
          <p className="text-sm text-gray-600">Danh sách học viên và trạng thái ví liên kết</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc địa chỉ ví..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="h-11 text-gray-900 border-gray-300 bg-white"
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <select
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Lọc theo Khóa học</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-3 flex gap-2 justify-end">
              <Button
                variant="outline"
                className="h-11 border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  try {
                    const rows = items.map((u) => ({
                      id: u.id,
                      name: u.name || "",
                      email: u.email || "",
                      phone: u.phone || "",
                      walletAddress: u.walletAddress || "",
                      createdAt: new Date(u.createdAt).toLocaleDateString("vi-VN"),
                    }));
                    const header = Object.keys(rows[0] || {}).join(",");
                    const body = rows.map((r) => Object.values(r).map((v) => String(v).replaceAll('"', '""')).map((v) => `"${v}"`).join(",")).join("\n");
                    const csv = `${header}\n${body}`;
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "learners_export.csv";
                    a.click();
                  } catch (e) {
                    toast.error("Không thể xuất dữ liệu");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button
                className="h-11 bg-gray-900 text-white"
                onClick={handleSearch}
              >
                Tìm
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thông tin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Liên hệ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ví NFT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày tham gia</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length ? (
                items.map((u) => (
                  <tr key={u.id} className="bg-white hover:bg-blue-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 grid place-items-center text-gray-700 font-medium">
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{u.name || "-"}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone || "-"}</td>
                    <td className="px-4 py-3">
                      {u.walletAddress ? (
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200">
                            {shorten(u.walletAddress)}
                          </code>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(u.walletAddress!);
                                toast.success("Đã sao chép địa chỉ ví");
                              } catch (e) {
                                toast.error("Không thể sao chép");
                              }
                            }}
                            aria-label="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 border border-gray-200">Chưa kết nối</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/learners/${u.id}`}>
                          <Button className="h-9 bg-blue-600 text-white hover:bg-blue-700">
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </Link>
                        <Button
                          className="h-9 bg-rose-600 text-white hover:bg-rose-700"
                          onClick={async () => {
                            if (confirm("Bạn có chắc muốn xóa học viên này?")) {
                              try {
                                await fetcher(`/api/admin/learners/${u.id}`, { method: "DELETE" });
                                toast.success("Đã xóa học viên");
                                refetch();
                              } catch (err) {
                                toast.error("Không thể xóa học viên");
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Không có học viên nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={data && page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
