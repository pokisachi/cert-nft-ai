"use client";

import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { KeyedMutator } from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

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

export default function CourseTable({ data, onDeleted }: CourseTableProps & { status?: string; q?: string; hideHeaderFilter?: boolean }) {
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

  const appliedStatus = typeof (arguments as any)[0]?.status === "string" && (arguments as any)[0]?.status !== "" ? (arguments as any)[0]?.status : statusFilter;
  const filtered = (appliedStatus === "all" ? courses : courses.filter((c) => c.status === appliedStatus)).filter((c) => {
    const q = ((arguments as any)[0]?.q || "").toString().trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên khóa học</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày bắt đầu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày kết thúc</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Công khai</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td
                  className="px-6 py-4 text-sm text-gray-900 font-medium cursor-pointer"
                  onClick={() => router.push(`/admin/courses/${c.id}/enrollments`)}
                  title="Xem danh sách ghi danh"
                >
                  {c.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{c.category}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{c.startDate?.slice(0, 10) || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{c.endDate?.slice(0, 10) || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.status === "UPCOMING"
                        ? "bg-yellow-100 text-yellow-800"
                        : c.status === "ONGOING"
                        ? "bg-green-100 text-green-800"
                        : c.status === "COMPLETED"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {c.status === "ONGOING" ? "ACTIVE" : c.status === "COMPLETED" ? "ENDED" : c.status === "CLOSED" ? "DRAFT" : c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap text-center">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={!!c.isPublic} readOnly />
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg"
                      onClick={() => router.push(`/admin/courses/${c.id}`)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Sửa
                    </button>
                    <ConfirmDialog
                      title="Xóa khóa học"
                      description={`Bạn có chắc chắn muốn xóa "${c.title}"?`}
                      onConfirm={() => handleDelete(c.id)}
                      trigger={
                        <button className="flex items-center text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Xóa
                        </button>
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-gray-600 py-4">Không có khóa học nào phù hợp.</p>
      )}
    </div>
  );
}
