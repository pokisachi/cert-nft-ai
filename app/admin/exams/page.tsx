"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
// import { FileText } from "lucide-react";

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  if (loading) return <p className="p-6 bg-[#111318] text-white">Đang tải danh sách kỳ thi...</p>;

  return (
    <div className="p-6 space-y-4 bg-[#111318] text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý các kỳ thi</h1>
        <Button onClick={() => (window.location.href = "/admin/exams/new")} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">
          Tạo kỳ thi mới
        </Button>
      </div>

      <table className="min-w-full border border-[#3b4354] bg-[#1c1f27] text-white rounded shadow-sm">
        <thead className="bg-[#282d39] border-b border-[#3b4354]">
          <tr>
            <th className="p-3 text-left text-[#9da6b9]">Khóa học</th>
            <th className="p-3 text-left text-[#9da6b9]">Phòng</th>
            <th className="p-3 text-left text-[#9da6b9]">Ngày thi</th>
            <th className="p-3 text-left text-[#9da6b9]">Sức chứa</th>
            <th className="p-3 text-left text-[#9da6b9]">Số học viên</th>
            <th className="p-3 text-left text-[#9da6b9]">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t border-[#3b4354] hover:bg-[#272b33]">
              <td className="p-3">{s.course.title}</td>
              <td className="p-3">{s.room}</td>
              <td className="p-3">{new Date(s.date).toLocaleString("vi-VN")}</td>
              <td className="p-3">{s.capacity}</td>
              <td className="p-3">{s._count.results}</td>
              <td className="p-3 space-x-2">
                <Button
                  size="sm"
                  onClick={() => (window.location.href = `/admin/exams/${s.id}/results`)}
                  className="bg-[#282d39] text-white hover:bg-[#303549]"
                >
                  Nhập điểm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => { setDeleteId(s.id); setConfirmDeleteOpen(true); }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sessions.length === 0 && (
        <p className="text-white/70 text-center py-4">Chưa có kỳ thi nào.</p>
      )}
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
  );
}

export function DeleteExamDialog({ open, onOpenChange, onConfirm, title }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void; title?: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent variant="dark" className="max-w-md w-[92vw]">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa kỳ thi</AlertDialogTitle>
          <AlertDialogDescription>{title ? `Kỳ thi: ${title}.` : "Bạn có chắc chắn muốn xóa?"}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="px-4 py-2 rounded bg-[#282d39] text-white">Hủy</AlertDialogCancel>
          <AlertDialogAction asChild>
            <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Xóa</button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
