"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Plus, Trash2 } from "lucide-react";

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  async function fetchSessions() {
    const res = await fetch("/api/admin/exam-sessions");
    const json = await res.json();
    setSessions(json);
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/exam-sessions/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      toast.success(json.message);
      fetchSessions();
    } else {
      toast.error(json.error || "Không thể xóa kỳ thi");
    }
  }

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return sessions;
    return sessions.filter((s: any) => ((s.course?.title || "").toLowerCase().includes(qq) || (s.room || "").toLowerCase().includes(qq)));
  }, [sessions, q]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto p-6">
        <div className="text-gray-600">Đang tải danh sách kỳ thi...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kỳ thi</h1>
          <p className="text-gray-500">Tổ chức và quản lý lịch thi, phòng thi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-auto flex-1">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm theo khóa học hoặc phòng..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <Button
              onClick={() => (window.location.href = "/admin/exams/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Tạo kỳ thi mới
            </Button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-6 text-left">Khóa học</th>
                <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-6 text-left">Phòng</th>
                <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-6 text-left">Thời gian</th>
                <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-6 text-left">Sĩ số</th>
                <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-6 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s: any) => {
                const dt = new Date(s.date);
                const timeStr = dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                const dateStr = dt.toLocaleDateString("vi-VN");
                const capacity = Number(s.capacity || 0);
                const registered = Number((s._count?.results as number) || 0);
                const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
                return (
                  <tr key={s.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{s.course?.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border border-gray-200">P. {s.room}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{timeStr}</div>
                      <div className="text-xs text-gray-500">{dateStr}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{registered} / {capacity}</div>
                      <div className="mt-1 h-1.5 w-40 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => (window.location.href = `/admin/exams/${s.id}/results`)}
                          className="border border-blue-200 text-blue-600 hover:bg-blue-50 bg-white"
                        >
                          Nhập điểm
                        </Button>
                        <button
                          className="inline-flex items-center justify-center h-9 w-9 rounded border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteId(s.id); setConfirmDeleteOpen(true); }}
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-600">Chưa có kỳ thi nào.</div>
          )}
        </div>

        <DeleteExamDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          onConfirm={() => {
            if (!deleteId) return;
            setConfirmDeleteOpen(false);
            handleDelete(deleteId);
          }}
          title={(() => {
            const s = sessions.find((x) => x.id === deleteId);
            return s?.course?.title || undefined;
          })()}
        />
      </div>
    </div>
  );
}

export function DeleteExamDialog({ open, onOpenChange, onConfirm, title }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void; title?: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent variant="light" className="max-w-md w-[92vw]">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa kỳ thi</AlertDialogTitle>
          <AlertDialogDescription>{title ? `Kỳ thi: ${title}.` : "Bạn có chắc chắn muốn xóa?"}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-100">Hủy</AlertDialogCancel>
          <AlertDialogAction asChild>
            <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Xóa</button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
