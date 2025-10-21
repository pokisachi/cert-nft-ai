"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { use } from "react";

type Row = {
  id: number;
  learner: { id: number; name: string; email: string };
  score: number | null;
  status: "PENDING" | "PASS" | "FAIL";
};

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null); // 🧩 thêm state

  // 🔹 Lấy danh sách kết quả thi
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/admin/exam-results?sessionId=${sessionId}`),
          fetch(`/api/admin/exam-sessions/${sessionId}`), // 🆕 API mới lấy thông tin ca thi
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        if (res1.ok) setRows(data1.data);
        else toast.error(data1.error);

        if (res2.ok) setSessionInfo(data2);
        else toast.error(data2.error);
      } catch (e: any) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, [sessionId]);

const handleSave = async (id: number, score: number | null) => {
  if (score === null || isNaN(Number(score))) {
    toast.error("Vui lòng nhập điểm hợp lệ!");
    return;
  }

  const res = await fetch(`/api/admin/exam-results/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score: Number(score) }),
  });

  const json = await res.json();
  if (res.ok) {
    toast.success(json.message || "✅ Lưu điểm thành công!");

    // ✅ Cập nhật lại state ngay trong frontend
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, score: Number(score), status: json.data?.status ?? r.status }
          : r
      )
    );
  } else {
    toast.error(json.error || "❌ Lưu thất bại");
  }
};



  if (loading) return <p className="p-6">Đang tải...</p>;

  // 🔹 Hiển thị tên khóa học rõ ràng
  const title =
    sessionInfo && sessionInfo.course
      ? `${sessionInfo.course.title} (${sessionInfo.room} - ${new Date(
          sessionInfo.date
        ).toLocaleDateString("vi-VN")})`
      : `#${sessionId}`;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nhập điểm thi khóa học: {title}</h1>

      {rows.length === 0 ? (
        <p className="text-gray-500 mt-4">❌ Hiện chưa có học viên nào trong ca thi này.</p>
      ) : (
        <table className="min-w-full border-collapse bg-white rounded shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Điểm</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.learner.name}</td>
                <td className="p-3">{r.learner.email}</td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={r.score ?? ""}
                    min={0}
                    max={100}
                    className="border rounded px-2 py-1 w-20"
                    onBlur={(e) => handleSave(r.id, Number(e.target.value))}
                  />
                </td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <Button onClick={() => handleSave(r.id, r.score || 0)}>
                    Lưu
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
