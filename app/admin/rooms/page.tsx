"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DoorOpen } from "lucide-react";

export default function AdminRoomsPage() {
  const { data: rooms, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Không thể tải danh sách phòng học");
      return res.json();
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa phòng học này?")) return;
    const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa phòng học!");
      refetch();
    } else toast.error("Lỗi khi xóa phòng học");
  }

  return (
    <main className="max-w-5xl mx-auto mt-8 space-y-6 bg-white text-slate-900 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold inline-flex items-center gap-2"><DoorOpen className="h-5 w-5" />Danh sách Phòng học</h1>
        <Link href="/admin/rooms/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Thêm Phòng
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms?.map((r: any) => (
          <Card key={r.id} className="p-4 space-y-2">
            <p className="font-semibold text-lg">Phòng {r.id}</p>
            <p className="text-sm text-slate-600">Sức chứa: {r.capacity}</p>

            {Array.isArray(r.usedSlots) && r.usedSlots.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-slate-600">Đã xếp ({r.scheduledCount}):</div>
                <div className="flex flex-wrap gap-2">
                  {r.usedSlots.map((code: string) => {
                    const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                    const slotMap: Record<string, string> = { MORNING: "07:30–09:00", AFTERNOON: "14:00–15:30", EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00", CA_1: "Ca 1", CA_2: "Ca 2" };
                    const parts = code.split("_");
                    const day = parts[0];
                    const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                    const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                    return (
                      <span key={code} className="text-xs rounded px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600">Chưa có lịch đã xếp</div>
            )}


            <div className="flex gap-3 mt-3">
              <Link href={`/admin/rooms/${r.id}/edit`}>
                <Button variant="outline">Sửa</Button>
              </Link>
              <Button variant="destructive" onClick={() => handleDelete(r.id)}>Xóa</Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
