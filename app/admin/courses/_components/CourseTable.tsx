"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { KeyedMutator } from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation"; // 🆕 thêm dòng này

export type Course = {
  id: number;
  title: string;
  category: string;
  startDate?: string;
  endDate?: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CLOSED";
  isPublic: boolean;
};

type CourseTableProps = {
  data: any; // từ SWR: { data: Course[], pagination: { ... } }
  onDeleted: KeyedMutator<any>;
};

export default function CourseTable({ data, onDeleted }: CourseTableProps) {
  const { toast } = useToast();
  const router = useRouter(); // 🆕 hook điều hướng
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ✅ ép kiểu để chắc chắn là mảng
  const courses: Course[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Đã xóa khóa học 🗑️" });
      onDeleted(); // reload danh sách
    } else {
      toast({ title: "Xóa thất bại", variant: "destructive" });
    }
  }

  // ✅ lọc theo trạng thái
  const filtered =
    statusFilter === "all"
      ? courses
      : courses.filter((c) => c.status === statusFilter);

  // ✅ sắp xếp theo trạng thái
  const statusOrder: Record<Course["status"], number> = {
    UPCOMING: 1,
    ONGOING: 2,
    COMPLETED: 3,
    CLOSED: 4,
  };

  const sorted = [...filtered].sort(
    (a, b) =>
      statusOrder[a.status as keyof typeof statusOrder] -
      statusOrder[b.status as keyof typeof statusOrder]
  );

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Danh sách khóa học</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">Tất cả</option>
          <option value="UPCOMING">UPCOMING</option>
          <option value="ONGOING">ONGOING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Bảng */}
      <table className="w-full border-collapse bg-white rounded shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Tên khóa học</th>
            <th className="p-3">Danh mục</th>
            <th className="p-3">Ngày bắt đầu</th>
            <th className="p-3">Ngày kết thúc</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Công khai</th>
            <th className="p-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              {/* 👇 thêm sự kiện click để đi đến trang ghi danh */}
              <td
                className="p-3 text-indigo-600 hover:underline cursor-pointer"
                onClick={() => router.push(`/admin/courses/${c.id}/enrollments`)}
                title="Xem danh sách ghi danh"
              >
                {c.title}
              </td>

              <td className="p-3">{c.category}</td>
              <td className="p-3">{c.startDate?.slice(0, 10) || "—"}</td>
              <td className="p-3">{c.endDate?.slice(0, 10) || "—"}</td>
              <td className="p-3">{c.status}</td>
              <td className="p-3 text-center">{c.isPublic ? "✅" : "❌"}</td>
              <td className="p-3 text-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/courses/${c.id}`)} // 🧩 dùng router thay vì window.location
                >
                  Sửa
                </Button>

                <ConfirmDialog
                  title="Xóa khóa học"
                  description={`Bạn có chắc chắn muốn xóa "${c.title}"?`}
                  onConfirm={() => handleDelete(c.id)}
                  trigger={
                    <Button size="sm" variant="destructive">
                      Xóa
                    </Button>
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Không có khóa học nào phù hợp.
        </p>
      )}
    </div>
  );
}
