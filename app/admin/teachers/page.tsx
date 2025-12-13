"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, Calendar, Mail } from "lucide-react";

const DAY_MAP: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
const SLOT_MAP: Record<string, string> = {
  MORNING: "07:30–09:00",
  AFTERNOON: "14:00–15:30",
  EVENING_1: "17:45–19:15",
  EVENING_2: "19:30–21:00",
  CA_1: "Ca 1",
  CA_2: "Ca 2",
};

export default function AdminTeachersPage() {
  const [q, setQ] = useState("");

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
    } else {
      toast.error("Lỗi khi xóa giảng viên");
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!Array.isArray(teachers)) return [];
    if (!s) return teachers;
    return teachers.filter((t: any) => {
      const name = String(t.name || "").toLowerCase();
      const email = String(t.email || "").toLowerCase();
      const quals = Array.isArray(t.qualifications) ? t.qualifications.join(" ").toLowerCase() : "";
      return name.includes(s) || email.includes(s) || quals.includes(s);
    });
  }, [teachers, q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full max-w-[1920px] mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Danh sách Giảng viên</h1>
            <p className="text-sm text-gray-600">Quản lý thông tin và lịch giảng dạy</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, email, chuyên môn..."
                className="pl-10 bg-white"
              />
            </div>
            <Link href="/admin/teachers/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm Giảng viên
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((t: any) => {
            const initial = String(t.name || "GV").trim().charAt(0).toUpperCase();
            const freeList: string[] = Array.isArray(t.freeSlots) ? t.freeSlots : [];
            const availList: string[] = Array.isArray(t.availability) ? t.availability : [];
            const freeDays = Array.from(new Set(freeList.map((code) => code.split("_")[0]))).map((d) => DAY_MAP[d] || d);

            return (
              <Card
                key={t.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {initial || "G"}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/admin/teachers/${t.id}/schedule`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-700 hover:underline line-clamp-1"
                    >
                      {t.name}
                    </Link>
                    <div className="mt-0.5 text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{t.email || "—"}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Đã xếp {Number(t.scheduledCount || 0)} buổi
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(t.qualifications) && t.qualifications.length > 0 ? (
                      t.qualifications.map((qname: string) => (
                        <span
                          key={qname}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md"
                        >
                          {qname}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Chưa có chuyên môn</span>
                    )}
                  </div>

                  {availList.length === 0 ? (
                    <div className="text-xs text-amber-600">Chưa cấu hình slot rảnh</div>
                  ) : freeList.length === 0 ? (
                    <div className="text-xs text-red-600">Đã kín (không còn slot rảnh)</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Rảnh: {freeDays.join(", ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {freeList.map((code: string) => {
                          const parts = code.split("_");
                          const day = parts[0];
                          const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                          const label = `${DAY_MAP[day] || day} • ${SLOT_MAP[slotId] || slotId || code}`;
                          return (
                            <span
                              key={code}
                              className="text-[11px] rounded px-2 py-0.5 bg-white text-gray-600 border border-gray-200"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3">
                  <Link href={`/admin/teachers/${t.id}/edit`}>
                    <Button variant="outline" className="w-full">
                      Sửa
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(t.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
