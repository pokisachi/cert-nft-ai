"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Box, BookOpen, CalendarDays, Pencil, Trash2 } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content?: string;
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
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

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

  const items = data?.data ?? [];

  const computed = useMemo(() => {
    const deriveType = (item: Announcement) => {
      if (item.courseId) return "Học tập";
      return "Hệ thống";
    };
    const filtered = items.filter((it) => {
      const t = deriveType(it);
      if (typeFilter && t !== typeFilter) return false;
      return true;
    });
    return filtered.map((it) => ({
      ...it,
      typeLabel: deriveType(it),
    }));
  }, [items, typeFilter]);

  const typeStyles = (label: string) => {
    if (label === "Hệ thống") return "bg-purple-100 text-purple-700 border border-purple-200";
    if (label === "Học tập") return "bg-blue-100 text-blue-700 border border-blue-200";
    if (label === "Sự kiện") return "bg-orange-100 text-orange-700 border border-orange-200";
    if (label === "Khuyến mãi") return "bg-pink-100 text-pink-700 border border-pink-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
    };

  const roleBadge = (role: string | null) => {
    const r = role || "ALL";
    if (r === "ALL") return "bg-gray-900 text-white";
    if (r === "LEARNER") return "bg-green-100 text-green-700 border border-green-200";
    if (r === "ADMIN") return "bg-slate-100 text-slate-700 border border-slate-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Bạn có chắc muốn xóa thông báo này?");
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Đã xóa thông báo!");
      refetch();
    } else {
      alert("Xóa thất bại!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full max-w-[1920px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-800">Quản lý thông báo</h1>
            <p className="text-sm text-gray-600">Notification Center</p>
          </div>
          <Link href="/admin/announcements/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tạo thông báo
            </Button>
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-[600px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Loại thông báo: Tất cả</option>
              <option value="Hệ thống">Hệ thống</option>
              <option value="Học tập">Học tập</option>
              <option value="Khuyến mãi">Khuyến mãi</option>
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Đối tượng: Tất cả</option>
              <option value="ALL">All Users</option>
              <option value="LEARNER">Students</option>
              <option value="ADMIN">Admins</option>
            </select>
            <Button variant="outline" onClick={() => refetch()}>Lọc</Button>
          </div>
        </div>

        <Card className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase">
                  <th className="text-left px-4 py-2">Loại</th>
                  <th className="text-left px-4 py-2">Tiêu đề & Nội dung</th>
                  <th className="text-left px-4 py-2">Đối tượng</th>
                  <th className="text-left px-4 py-2">Ngày gửi</th>
                  <th className="text-left px-4 py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-3 text-gray-600" colSpan={5}>Đang tải...</td>
                  </tr>
                ) : computed.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-gray-600" colSpan={5}>Không có dữ liệu</td>
                  </tr>
                ) : (
                  computed.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200 hover:bg-blue-50/50">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded ${typeStyles(item.typeLabel)}`}>
                          {item.typeLabel === "Hệ thống" ? (
                            <Box className="w-4 h-4" />
                          ) : item.typeLabel === "Học tập" ? (
                            <BookOpen className="w-4 h-4" />
                          ) : (
                            <CalendarDays className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium">{item.typeLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[600px]">{item.content || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${roleBadge(item.targetRole)}`}>
                          {item.targetRole === "ALL" || !item.targetRole ? "All Users" : item.targetRole === "LEARNER" ? "Students" : "Admins"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/announcements/${item.id}`} className="p-2 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50" aria-label="Sửa">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button className="p-2 rounded-md border border-gray-200 text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)} aria-label="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {data && data.total > 10 && (
          <div className="flex justify-center items-center gap-4">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
            <span className="text-gray-600">Trang {page} / {Math.ceil(data.total / 10)}</span>
            <Button variant="outline" disabled={page * 10 >= data.total} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
          </div>
        )}
      </main>
    </div>
  );
}
