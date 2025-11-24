"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Announcement {
  id: number;
  title: string;
  targetRole: string | null;
  courseId: number | null;
  createdAt: string;
}

interface AnnouncementResponse {
  data: Announcement[];
  total: number;
  page: number;
}

export default function AdminAnnouncementsPage() {
  // --- State ---
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // --- Query ---
  const { data, isLoading, refetch } = useQuery<AnnouncementResponse>({
    queryKey: ["admin-announcements", page, search, roleFilter],
    queryFn: async () => {
      const query = new URLSearchParams({
        page: String(page),
        title: search,
        targetRole: roleFilter,
      });
      const res = await fetch(`/api/admin/announcements?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
  });

  // --- Handler ---
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Bạn có chắc muốn xóa thông báo này?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("Đã xóa thông báo!");
      refetch();
    } else {
      alert("Xóa thất bại!");
    }
  };

  // --- UI ---
  return (
    <main className="p-6 bg-[#111318] text-white min-h-[calc(100vh-64px)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Quản lý thông báo</h1>
        <Link href="/admin/announcements/new">
          <Button className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Tạo thông báo mới</Button>
        </Link>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="rounded-md border border-[#3b4354] bg-[#12151b] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          placeholder="Tìm kiếm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="LEARNER">LEARNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ALL">ALL</option>
        </select>
        <Button onClick={() => refetch()} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Lọc</Button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="border border-[#3b4354] rounded-2xl overflow-x-auto">
        <table className="min-w-full text-sm bg-[#1c1f27] text-white">
          <thead>
            <tr className="bg-[#232734] text-white">
              <th className="p-3 text-left border-b border-[#3b4354]">ID</th>
              <th className="p-3 text-left border-b border-[#3b4354]">Tiêu đề</th>
              <th className="p-3 text-left border-b border-[#3b4354]">Đối tượng</th>
              <th className="p-3 text-left border-b border-[#3b4354]">Khóa học</th>
              <th className="p-3 text-left border-b border-[#3b4354]">Ngày tạo</th>
              <th className="p-3 text-center border-b border-[#3b4354]">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-[#9da6b9]">Đang tải...</td>
              </tr>
            )}

            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-[#9da6b9]">Không có thông báo nào.</td>
              </tr>
            )}

            {data?.data?.map((item) => (
              <tr key={item.id} className="hover:bg-[#242833]">
                <td className="p-3 border-b border-[#2b3040] text-white/90">{item.id}</td>
                <td className="p-3 border-b border-[#2b3040] text-white">{item.title}</td>
                <td className="p-3 border-b border-[#2b3040] text-[#9da6b9]">{item.targetRole || '-'}</td>
                <td className="p-3 border-b border-[#2b3040] text-[#9da6b9]">{item.courseId ?? '-'}</td>
                <td className="p-3 border-b border-[#2b3040] text-[#9da6b9]">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="p-3 border-b border-[#2b3040]">
                  <div className="flex justify-center gap-2">
                    <Link href={`/admin/announcements/${item.id}`}>
                      <Button variant="outline" size="sm" className="border-[#3b4354] text-white">Sửa</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {data && data.total > 10 && (
        <div className="flex justify-center items-center gap-4 mt-4 text-white">
          <Button variant="outline" className="border-[#3b4354] text-white" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span className="text-[#9da6b9]">Trang {page} / {Math.ceil(data.total / 10)}</span>
          <Button variant="outline" className="border-[#3b4354] text-white" disabled={page * 10 >= data.total} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}
    </main>
  );
}
