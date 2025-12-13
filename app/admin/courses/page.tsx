"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import CourseTable from "./_components/CourseTable";
import { BookOpen, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CoursesPage() {
  const { data, mutate } = useSWR("/api/admin/courses", fetcher);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const list = useMemo(() => {
    if (Array.isArray(data)) return data as any[];
    if (Array.isArray((data as any)?.data)) return (data as any).data as any[];
    return [] as any[];
  }, [data]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(list.map((c: any) => c?.category).filter(Boolean)));
    return ["all", ...cats];
  }, [list]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((c: any) => {
      const matchesQ = qq
        ? ((c.title || "").toLowerCase().includes(qq) || (c.category || "").toLowerCase().includes(qq))
        : true;
      const matchesStatus = status === "all" ? true : c.status === status;
      const matchesCat = category === "all" ? true : c.category === category;
      return matchesQ && matchesStatus && matchesCat;
    });
  }, [list, q, status, category]);

  useEffect(() => {
    setPage(1);
  }, [q, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black inline-flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-blue-600" />
              Quản lý khóa học
            </h1>
            <p className="text-gray-600 text-sm">Quản lý danh sách và trạng thái đào tạo</p>
          </div>
          <div className="flex items-center">
            <Button
              onClick={() => (window.location.href = "/admin/courses/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Thêm khóa học mới
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm theo tên khóa học..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              className="flex-1 md:flex-none rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Tất cả danh mục" : cat}
                </option>
              ))}
            </select>
            <select
              className="flex-1 md:flex-none rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="UPCOMING">Sắp mở</option>
              <option value="ONGOING">Đang dạy</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
          <CourseTable data={paginated} onDeleted={mutate} hideHeaderFilter />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-700">
            <div>Trang {page}/{totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
