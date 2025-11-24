"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import CourseTable from "./_components/CourseTable";
import { BookOpen } from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CoursesPage() {
  const { data, mutate } = useSWR("/api/admin/courses", fetcher);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  if (!data) return <div className="p-6 bg-[#111318] text-white">Đang tải...</div>;

  return (
    <div className="p-6 space-y-6 bg-[#111318] text-white">
      <div className="rounded-2xl border border-[#3b4354] bg-gradient-to-br from-[#1c1f27] to-[#242833] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold inline-flex items-center gap-2"><BookOpen className="h-6 w-6" />Quản lý khóa học</h1>
            <p className="text-white/70 text-sm">Tạo, chỉnh sửa và theo dõi các khóa học đang vận hành.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => (window.location.href = "/admin/courses/new")} className="bg-indigo-600 hover:bg-indigo-700 text-white">➕ Thêm khóa học mới</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr,200px] gap-3">
          <input
            className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white placeholder-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Tìm theo tên hoặc danh mục"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      <CourseTable data={data} onDeleted={mutate} q={q} status={status} hideHeaderFilter />
    </div>
  );
}
