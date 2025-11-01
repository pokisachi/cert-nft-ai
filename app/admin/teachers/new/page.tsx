"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

export default function NewTeacherPage() {
  const [name, setName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQualName, setNewQualName] = useState("");
  const [newQualCategory, setNewQualCategory] = useState("");

  // ✅ Fetch danh sách chuyên môn
  const { data: qualifications, refetch } = useQuery({
    queryKey: ["qualifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/qualifications");
      if (!res.ok) throw new Error("Không thể tải danh sách chuyên môn");
      return res.json();
    },
  });

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

  // 🧩 Thêm chuyên môn mới ngay tại form
  async function handleAddQualification() {
    if (!newQualName || !newQualCategory)
      return toast.error("Vui lòng nhập đủ tên và loại chuyên môn");

    const res = await fetch("/api/admin/qualifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newQualName, category: newQualCategory }),
    });

    if (res.ok) {
      toast.success("Đã thêm chuyên môn mới!");
      setNewQualName("");
      setNewQualCategory("");
      setShowAddForm(false);
      refetch();
    } else toast.error("Lỗi khi thêm chuyên môn");
  }

  // 🧩 Tạo giảng viên
  async function handleCreate() {
    if (!name) return toast.error("Vui lòng nhập tên giảng viên");
    if (selectedSlots.length === 0) return toast.error("Chọn ít nhất 1 khung giờ rảnh");
    if (selectedQualifications.length === 0) return toast.error("Chọn ít nhất 1 chuyên môn");

    const payload = {
      name,
      availability: selectedSlots,
      qualificationIds: selectedQualifications,
    };

    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Thêm giảng viên thành công!");
      setName("");
      setSelectedSlots([]);
      setSelectedQualifications([]);
    } else {
      const err = await res.json();
      toast.error(err.error || "Lỗi khi thêm giảng viên");
    }
  }

  return (
    <main className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-6">➕ Thêm Giảng viên</h1>

      <Card className="p-6 space-y-4">
        <Input
          placeholder="Tên giảng viên"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* 🔹 Chọn chuyên môn */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Chọn chuyên môn:</p>
            <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Đóng" : "➕ Thêm chuyên môn mới"}
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-4 space-y-2 border rounded p-3 bg-gray-50">
              <Input
                placeholder="Tên chuyên môn (VD: TOEIC 450+)"
                value={newQualName}
                onChange={(e) => setNewQualName(e.target.value)}
              />
              <Input
                placeholder="Phân loại (VD: TOEIC, IELTS, ...)"
                value={newQualCategory}
                onChange={(e) => setNewQualCategory(e.target.value)}
              />
              <Button onClick={handleAddQualification}>Lưu chuyên môn mới</Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {qualifications?.map((q: any) => {
              const active = selectedQualifications.includes(q.id);
              return (
                <Badge
                  key={q.id}
                  onClick={() => toggleQualification(q.id)}
                  className={`cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {q.name} ({q.category})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 🔹 Bảng chọn lịch rảnh */}
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

        <Button onClick={handleCreate}>💾 Lưu Giảng viên</Button>
      </Card>
    </main>
  );
}
