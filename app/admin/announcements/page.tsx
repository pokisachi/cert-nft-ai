"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">📢 Quản lý thông báo</h1>
        <Link href="/admin/announcements/new">
          <Button>➕ Tạo thông báo mới</Button>
        </Link>
      </div>

      {/* --- Bộ lọc --- */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1"
          placeholder="Tìm kiếm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="LEARNER">LEARNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ALL">ALL</option>
        </select>
        <Button onClick={() => refetch()}>🔍 Lọc</Button>
      </div>

      {/* --- Bảng dữ liệu --- */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Tiêu đề</th>
              <th className="p-2 border">Đối tượng</th>
              <th className="p-2 border">Khóa học</th>
              <th className="p-2 border">Ngày tạo</th>
              <th className="p-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Đang tải...
                </td>
              </tr>
            )}

            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Không có thông báo nào.
                </td>
              </tr>
            )}

            {data?.data?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border text-center">{item.id}</td>
                <td className="p-2 border">{item.title}</td>
                <td className="p-2 border text-center">
                  {item.targetRole || "-"}
                </td>
                <td className="p-2 border text-center">
                  {item.courseId ?? "-"}
                </td>
                <td className="p-2 border text-center">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-2 border text-center">
                  <div className="flex justify-center gap-2">
                    <Link href={`/admin/announcements/${item.id}`}>
                      <Button variant="outline" size="sm">
                        ✏️ Sửa
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️ Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Phân trang --- */}
      {data && data.total > 10 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </Button>
          <span>
            Trang {page} / {Math.ceil(data.total / 10)}
          </span>
          <Button
            variant="outline"
            disabled={page * 10 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </Button>
        </div>
      )}
    </div>
  );
}
