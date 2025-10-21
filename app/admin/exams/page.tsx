"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm("Bạn có chắc chắn muốn xóa kỳ thi này không?")) return;
    const res = await fetch(`/api/admin/exam-sessions/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      toast.success(json.message);
      fetchSessions();
    } else {
      toast.error(json.error || "Không thể xóa kỳ thi");
    }
  }

  if (loading) return <p className="p-6">Đang tải danh sách kỳ thi...</p>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">📚 Quản lý các kỳ thi</h1>
        <Button onClick={() => (window.location.href = "/admin/exams/new")}>
          ➕ Tạo kỳ thi mới
        </Button>
      </div>

      <table className="min-w-full border bg-white rounded shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Khóa học</th>
            <th className="p-3 text-left">Phòng</th>
            <th className="p-3 text-left">Ngày thi</th>
            <th className="p-3 text-left">Sức chứa</th>
            <th className="p-3 text-left">Số học viên</th>
            <th className="p-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{s.course.title}</td>
              <td className="p-3">{s.room}</td>
              <td className="p-3">{new Date(s.date).toLocaleString("vi-VN")}</td>
              <td className="p-3">{s.capacity}</td>
              <td className="p-3">{s._count.results}</td>
              <td className="p-3 space-x-2">
                <Button
                  size="sm"
                  onClick={() => (window.location.href = `/admin/exams/${s.id}/results`)}
                >
                  Nhập điểm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(s.id)}
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sessions.length === 0 && (
        <p className="text-gray-500 text-center py-4">Chưa có kỳ thi nào.</p>
      )}
    </div>
  );
}
