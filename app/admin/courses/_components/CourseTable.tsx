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
    <div className="space-y-4">
      {!(arguments as any)[0]?.hideHeaderFilter && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Danh sách khóa học</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#3b4354] rounded p-2 bg-[#1c1f27] text-white"
          >
            <option value="all">Tất cả</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      )}

      <table className="w-full border-collapse rounded-2xl shadow-lg border border-[#3b4354] bg-[#1c1f27] text-white">
        <thead>
          <tr className="bg-[#282d39] text-left border-b border-[#3b4354]">
            <th className="p-4 text-[#9da6b9]">Tên khóa học</th>
            <th className="p-4 text-[#9da6b9]">Danh mục</th>
            <th className="p-4 text-[#9da6b9]">Ngày bắt đầu</th>
            <th className="p-4 text-[#9da6b9]">Ngày kết thúc</th>
            <th className="p-4 text-[#9da6b9]">Trạng thái</th>
            <th className="p-4 text-[#9da6b9]">Công khai</th>
            <th className="p-4 text-center text-[#9da6b9]">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} className="border-t border-[#3b4354] hover:bg-[#272b33]">
              {/* Tên khóa học → click vào xem danh sách ghi danh */}
              <td
                className="p-4 text-white cursor-pointer hover:bg-[#242833] rounded"
                onClick={() => router.push(`/admin/courses/${c.id}/enrollments`)}
                title="Xem danh sách ghi danh"
              >
                {c.title}
              </td>

              <td className="p-4">{c.category}</td>
              <td className="p-4">{c.startDate?.slice(0, 10) || "—"}</td>
              <td className="p-4">{c.endDate?.slice(0, 10) || "—"}</td>
              <td className="p-4">
                <span className={`text-xs rounded px-2 py-1 border ${
                  c.status === "UPCOMING" ? "bg-indigo-900/30 text-indigo-300 border-indigo-500/40" :
                  c.status === "ONGOING" ? "bg-emerald-900/30 text-emerald-300 border-emerald-500/40" :
                  c.status === "COMPLETED" ? "bg-slate-800/60 text-slate-300 border-slate-600/40" :
                  "bg-red-900/30 text-red-300 border-red-600/40"
                }`}>{c.status}</span>
              </td>
              <td className="p-4 text-center">{c.isPublic ? "✅" : "❌"}</td>

              <td className="p-4 text-center space-x-2">
                {/* 🧠 Nút Lịch học AI */}
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
        <p className="text-center text-white/70 py-4">
          Không có khóa học nào phù hợp.
        </p>
      )}
    </div>
  );
}
