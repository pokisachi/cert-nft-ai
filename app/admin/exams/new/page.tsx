"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewExamSessionPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [room, setRoom] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(30);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      setCourses(json.data || json);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !room || !date) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const res = await fetch("/api/admin/exam-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, room, date, capacity }),
    });

    const json = await res.json();
    if (res.ok) {
      toast.success(`✅ ${json.message}`);
      window.location.href = "/admin/exams";
    } else {
      toast.error(json.error || "Lỗi tạo kỳ thi");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 bg-[#111318] text-white">
      <h1 className="text-2xl font-semibold">Tạo kỳ thi mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-white/80">Khóa học</label>
          <select
            className="border border-[#3b4354] bg-[#1c1f27] text-white rounded px-3 py-2 w-full"
            onChange={(e) => setCourseId(Number(e.target.value))}
          >
            <option value="">-- Chọn khóa học --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-white/80">Phòng thi</label>
          <input
            className="border border-[#3b4354] bg-[#1c1f27] text-white rounded px-3 py-2 w-full"
            placeholder="VD: Phòng A1"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-white/80">Ngày & giờ thi</label>
          <input
            type="datetime-local"
            className="border border-[#3b4354] bg-[#1c1f27] text-white rounded px-3 py-2 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-white/80">Sức chứa</label>
          <input
            type="number"
            min={1}
            className="border border-[#3b4354] bg-[#1c1f27] text-white rounded px-3 py-2 w-full"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">
          Tạo kỳ thi
        </Button>
      </form>
    </div>
  );
}
