"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DAYS = [
  { label: "Thứ 2", value: "Mon" },
  { label: "Thứ 3", value: "Tue" },
  { label: "Thứ 4", value: "Wed" },
  { label: "Thứ 5", value: "Thu" },
  { label: "Thứ 6", value: "Fri" },
  { label: "Thứ 7", value: "Sat" },
  { label: "CN", value: "Sun" },
];

const TIME_SLOTS = [
  { label: "17h45–19h15", value: "EVENING_1" },
  { label: "19h30–21h00", value: "EVENING_2" },
];

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const teacherId = params.id;

  const [name, setName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);

  // 📦 Load thông tin giảng viên hiện tại
  useEffect(() => {
    async function loadTeacher() {
      const res = await fetch(`/api/admin/teachers`);
      const data = await res.json();
      const teacher = data.find((t: any) => t.id === teacherId);
      if (teacher) {
        setName(teacher.name);
        setSelectedSlots(teacher.availability || []);
        setSelectedQualifications(teacher.qualificationsIds || []);
      }
    }

    async function loadQualifications() {
      const res = await fetch("/api/admin/qualifications");
      setQualifications(await res.json());
    }

    loadTeacher();
    loadQualifications();
  }, [teacherId]);

  const toggleSlot = (id: string) => {
    setSelectedSlots((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleQualification = (id: string) => {
    setSelectedQualifications((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  async function handleUpdate() {
    const payload = {
      name,
      availability: selectedSlots,
      qualificationIds: selectedQualifications,
    };

    const res = await fetch(`/api/admin/teachers/${teacherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Đã cập nhật giảng viên!");
      router.push("/admin/teachers");
    } else {
      toast.error("Lỗi khi cập nhật giảng viên");
    }
  }

  return (
    <main className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-6">✏️ Sửa Giảng viên</h1>

      <Card className="p-6 space-y-4">
        <Input
          placeholder="Tên giảng viên"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium mb-2">Chọn chuyên môn:</p>
          <div className="flex flex-wrap gap-2">
            {qualifications.map((q) => {
              const active = selectedQualifications.includes(q.id);
              return (
                <Badge
                  key={q.id}
                  onClick={() => toggleQualification(q.id)}
                  className={`cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {q.name} ({q.category})
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Chọn lịch rảnh:</p>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full divide-y divide-gray-200 text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-xs uppercase text-gray-500">Ca học</th>
                  {DAYS.map((day) => (
                    <th key={day.value} className="p-2 text-xs uppercase text-gray-500">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot.value}>
                    <td className="p-2 font-semibold">{slot.label}</td>
                    {DAYS.map((day) => {
                      const id = `${day.value}_${slot.value}`;
                      const active = selectedSlots.includes(id);
                      return (
                        <td
                          key={id}
                          onClick={() => toggleSlot(id)}
                          className={`cursor-pointer p-2 transition ${
                            active
                              ? "bg-indigo-600 text-white"
                              : "hover:bg-indigo-100 text-gray-600"
                          }`}
                        >
                          {active ? "✓" : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Button onClick={handleUpdate}>💾 Lưu thay đổi</Button>
      </Card>
    </main>
  );
}
