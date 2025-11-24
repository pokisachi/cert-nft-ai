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
    <main className="max-w-5xl mx-auto mt-8 p-6 bg-[#111318] text-white">
      <h1 className="text-2xl font-semibold mb-6">Thêm Giảng viên</h1>

      <Card variant="dark" className="p-6 space-y-4 border-[#3b4354]">
        <Input
          placeholder="Tên giảng viên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-[#3b4354] bg-[#12151b] text-white"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Chọn chuyên môn:</p>
            <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)} className="border-[#3b4354] text-white hover:bg-[#232734]">
              {showAddForm ? "Đóng" : "Thêm chuyên môn mới"}
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-4 space-y-2 border border-[#3b4354] rounded p-3 bg-[#12151b]">
              <Input
                placeholder="Tên chuyên môn (VD: TOEIC 450+)"
                value={newQualName}
                onChange={(e) => setNewQualName(e.target.value)}
                className="border border-[#3b4354] bg-[#1c1f27] text-white"
              />
              <Input
                placeholder="Phân loại (VD: TOEIC, IELTS, ...)"
                value={newQualCategory}
                onChange={(e) => setNewQualCategory(e.target.value)}
                className="border border-[#3b4354] bg-[#1c1f27] text-white"
              />
              <Button onClick={handleAddQualification} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Lưu chuyên môn mới</Button>
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
                      : "bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354] hover:bg-[#272b33]"
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
          <div className="overflow-x-auto rounded border border-[#3b4354]">
            <table className="min-w-full text-center">
              <thead className="bg-[#282d39]">
                <tr>
                  <th className="p-2 text-xs uppercase text-[#9da6b9]">Ca học</th>
                  {DAYS.map((day) => (
                    <th key={day.value} className="p-2 text-xs uppercase text-[#9da6b9]">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-[#1c1f27] divide-y divide-[#3b4354]">
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot.value}>
                    <td className="p-2 font-semibold text-white">{slot.label}</td>
                    {DAYS.map((day) => {
                      const id = `${day.value}_${slot.value}`;
                      const active = selectedSlots.includes(id);
                      return (
                        <td
                          key={id}
                          onClick={() => toggleSlot(id)}
                          className={`cursor-pointer p-2 transition text-lg font-semibold ${
                            active
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-[#1c1f27] text-[#9da6b9] hover:bg-[#272b33]"
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
          {/* preview chips lựa chọn */}
          {selectedSlots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSlots.map((code) => {
                const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                const slotMap: Record<string, string> = { EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00" };
                const parts = code.split("_");
                const day = parts[0];
                const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                return (
                  <span key={code} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 p-3 border border-[#3b4354] rounded bg-[#12151b]">
          <div className="text-sm text-white/80 mb-2">Tóm tắt lựa chọn</div>
          <div className="flex flex-wrap gap-2">
            {selectedQualifications.map((qid) => {
              const q = (qualifications || []).find((x: any) => x.id === qid);
              const label = q ? `${q.name} (${q.category})` : qid;
              return (
                <span key={qid} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">
                  {label}
                </span>
              );
            })}
          </div>
          {selectedSlots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSlots.map((code) => {
                const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                const slotMap: Record<string, string> = { EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00" };
                const parts = code.split("_");
                const day = parts[0];
                const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                return (
                  <span key={code} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <Button onClick={handleCreate} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Lưu Giảng viên</Button>
      </Card>
    </main>
  );
}
