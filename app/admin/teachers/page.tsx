"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminTeachersPage() {
  const { data: teachers, refetch } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Không thể tải danh sách giảng viên");
      return res.json();
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa giảng viên này?")) return;
    const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa giảng viên!");
      refetch();
    } else toast.error("Lỗi khi xóa giảng viên");
  }

  return (
    <main className="max-w-5xl mx-auto mt-8 space-y-6 bg-[#111318] text-white p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Danh sách Giảng viên</h1>
        <Link href="/admin/teachers/new">
          <Button className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">
            Thêm Giảng viên
          </Button>
        </Link>
      </div>

      {/* chips hiển thị lịch rảnh theo mã Mon_EVENING_1 → T2 • 17:45–19:15 */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers?.map((t: any) => (
          <Card key={t.id} className="p-4 space-y-2 border-[#3b4354] bg-[#1c1f27] hover:border-indigo-500/50 hover:bg-[#242833] transition" variant="dark">
            <p className="font-semibold text-lg">{t.name}</p>
            <p className="text-sm text-white/70">
              <strong>Chuyên môn:</strong> {t.qualifications?.join(", ") || "Chưa có"}
            </p>

            <div className="flex flex-wrap gap-1">
              {t.availability?.map((code: string) => {
                const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                const slotMap: Record<string, string> = { EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00" };
                const parts = code.split("_");
                const day = parts[0];
                const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                return (
                  <span key={code} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">
                    {label}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-3 mt-3">
              <Link href={`/admin/teachers/${t.id}/edit`}>
                <Button variant="outline" className="border-[#3b4354] text-white hover:bg-[#232734]">Sửa</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => handleDelete(t.id)}
              >
                Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
