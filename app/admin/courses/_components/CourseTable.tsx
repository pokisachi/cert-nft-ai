"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { KeyedMutator } from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Course = {
  id: number;
  title: string;
  category: string;
  startDate?: string;
  endDate?: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CLOSED";
  isPublic: boolean;
  hasSchedule?: boolean; // ✅ bạn có thể bổ sung field này sau từ API nếu muốn
};

type CourseTableProps = {
  data: any;
  onDeleted: KeyedMutator<any>;
};

export default function CourseTable({ data, onDeleted }: CourseTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const courses: Course[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Đã xóa khóa học 🗑️" });
      onDeleted();
    } else {
      toast({ title: "Xóa thất bại", variant: "destructive" });
    }
  }

  const filtered =
    statusFilter === "all"
      ? courses
      : courses.filter((c) => c.status === statusFilter);

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
              {/* Tên khóa học → click vào xem danh sách ghi danh */}
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
                {/* 🧠 Nút Lịch học AI */}
                <Button
                  size="sm"
                  variant={c.hasSchedule ? "default" : "secondary"}
                  onClick={() => router.push(`/admin/courses/${c.id}/schedule`)}
                >
                  {c.hasSchedule ? "📅 Xem lịch học" : "🧠 Tạo lịch học AI"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/courses/${c.id}`)}
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
