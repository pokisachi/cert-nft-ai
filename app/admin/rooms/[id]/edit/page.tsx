"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [capacity, setCapacity] = useState<number>(0);
  const [availability, setAvailability] = useState<string[]>([]);

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

  useEffect(() => {
    async function loadRoom() {
      const res = await fetch(`/api/admin/rooms`);
      const data = await res.json();
      const room = data.find((r: any) => r.id === roomId);
      if (room) {
        setCapacity(room.capacity);
        setAvailability(room.availability || []);
      }
    }
    loadRoom();
  }, [roomId]);

  function toggle(day: string, slot: string) {
    const code = `${day}_${slot}`;
    setAvailability((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleUpdate() {
    const payload = { capacity, availability };
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Đã cập nhật phòng học!");
      router.push("/admin/rooms");
    } else {
      toast.error("Lỗi khi cập nhật phòng học");
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn chắc chắn muốn xóa phòng học này?")) return;
    const res = await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa phòng học!");
      router.push("/admin/rooms");
    } else toast.error("Không thể xóa phòng học");
  }

  return (
    <main className="max-w-4xl mx-auto mt-10 px-6 py-6 bg-[#111318] text-white rounded-2xl">
      <h1 className="text-2xl font-semibold mb-6">Sửa Phòng học {roomId}</h1>

      <Card variant="dark" className="p-6 space-y-4 border-[#3b4354]">
        <div>
          <label className="text-sm font-medium">Sức chứa:</label>
          <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="mt-2 border border-[#3b4354] bg-[#12151b] text-white" />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Chọn lịch rảnh của phòng:</p>
          <div className="overflow-x-auto rounded border border-[#3b4354]">
            <table className="min-w-full text-center">
              <thead>
                <tr className="bg-[#232734]">
                  <th className="p-3 text-white">Ca học</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="p-3 text-white">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((t) => (
                  <tr key={t.value} className="border-t border-[#2b3040]">
                    <td className="p-3 text-white font-semibold">{t.label}</td>
                    {DAYS.map((d) => {
                      const code = `${d.value}_${t.value}`;
                      const on = availability.includes(code);
                      return (
                        <td key={code} className="p-3">
                          <button
                            onClick={() => toggle(d.value, t.value)}
                            className={`w-8 h-8 rounded border ${on ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1c1f27] border-[#3b4354] text-[#9da6b9]'} hover:border-indigo-400`}
                          >
                            {on ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {availability.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {availability.map((code) => {
                const dayMap: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
                const slotMap: Record<string, string> = { EVENING_1: "17:45–19:15", EVENING_2: "19:30–21:00" };
                const parts = code.split("_");
                const day = parts[0];
                const slotId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1] || "";
                const label = `${dayMap[day] || day} • ${slotMap[slotId] || slotId || code}`;
                return (
                  <span key={code} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">{label}</span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="destructive" onClick={handleDelete}>Xóa Phòng</Button>
          <Button onClick={handleUpdate} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Lưu thay đổi</Button>
        </div>
      </Card>
    </main>
  );
}
