"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <main className="max-w-5xl mx-auto mt-8 space-y-6 bg-[#F7F8FA] text-slate-800 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Danh sách Giảng viên</h1>
        <Link href="/admin/teachers/new">
          <Button>
            Thêm Giảng viên
          </Button>
        </Link>
      </div>

      {/* chips hiển thị lịch rảnh theo mã Mon_EVENING_1 → T2 • 17:45–19:15 */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers?.map((t: any) => (
          <Card key={t.id} className="p-4 space-y-2">
            <Link href={`/admin/teachers/${t.id}/schedule`}>
              <p className="font-semibold text-lg text-slate-900 hover:text-blue-700 hover:underline">{t.name}</p>
            </Link>
            <p className="text-sm text-slate-600">
              <strong>Chuyên môn:</strong> {t.qualifications?.join(", ") || "Chưa có"}
            </p>

            {Array.isArray(t.usedSlots) && t.usedSlots.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-slate-600">Đã xếp ({t.scheduledCount}):</div>
                <div className="flex flex-wrap gap-1">
                  {t.usedSlots.map((code: string) => {
                    const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                    const slotMap: Record<string, string> = { EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00" };
                    const parts = code.split("_");
                    const day = parts[0];
                    const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                    const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                    return (
                      <span key={code} className="text-xs rounded px-2 py-0.5 bg-white text-slate-600 border border-slate-200">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600">Chưa có lịch đã xếp</div>
            )}

            <div className="space-y-1">
              {(() => {
                const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                const slotMap: Record<string, string> = { MORNING: "07:30–09:00", AFTERNOON: "14:00–15:30", EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00", CA_1: "Ca 1", CA_2: "Ca 2" };
                const freeList: string[] = Array.isArray(t.freeSlots) ? t.freeSlots : [];
                const availList: string[] = Array.isArray(t.availability) ? t.availability : [];
                if (availList.length === 0) {
                  return <div className="text-xs text-amber-600">Chưa cấu hình slot rảnh</div>;
                }
                if (freeList.length === 0) {
                  return <div className="text-xs text-red-600">Đã kín (không còn slot rảnh)</div>;
                }
                const freeDays = Array.from(new Set(freeList.map((code) => code.split("_")[0]))).map((d) => dayMap[d] || d);
                return (
                  <>
                    <div className="text-xs text-slate-600">Ngày rảnh: {freeDays.join(", ")}</div>
                    <div className="flex flex-wrap gap-1">
                      {freeList.map((code: string) => {
                        const parts = code.split("_");
                        const day = parts[0];
                        const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                        const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                        return (
                          <span key={code} className="text-xs rounded px-2 py-0.5 bg-white text-slate-600 border border-slate-200">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>


            <div className="flex gap-3 mt-3">
              <Link href={`/admin/teachers/${t.id}/edit`}>
                <Button variant="outline">Sửa</Button>
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
