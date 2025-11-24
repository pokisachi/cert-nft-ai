"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

export default function AdminRoomsPage() {
  const { data: rooms, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Không tải được danh sách phòng học");
      return res.json();
    },
  });

  const [id, setId] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  function toggle(day: string, slot: string) {
    const code = `${day}_${slot}`;
    setSelectedSlots((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleCreate() {
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, capacity, availability: selectedSlots }),
    });

    if (res.ok) {
      toast.success("Đã thêm phòng học!");
      setId("");
      setCapacity(0);
      setSelectedSlots([]);
      refetch();
    } else {
      toast.error("Lỗi khi thêm phòng học");
    }
  }

  return (
    <main className="max-w-3xl mx-auto mt-8 px-6 py-6 bg-[#111318] text-white rounded-2xl">
      <h1 className="text-2xl font-semibold mb-6">Thêm Phòng học</h1>
      <Card variant="dark" className="p-6 space-y-4 border-[#3b4354]">
        <div className="flex gap-2">
          <Input placeholder="Mã phòng (vd: A101)" value={id} onChange={(e) => setId(e.target.value)} className="border border-[#3b4354] bg-[#12151b] text-white" />
          <Input placeholder="Sức chứa" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="border border-[#3b4354] bg-[#12151b] text-white w-32" />
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
                      const on = selectedSlots.includes(code);
                      return (
                        <td key={code} className="p-3">
                          <button
                            onClick={() => toggle(d.value, t.value)}
                            className={`w-8 h-8 rounded border ${on ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1c1f27] border-[#3b4354] text-[#9da6b9]'} hover:border-indigo-400`}
                            aria-label={`Toggle ${code}`}
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
                  <span key={code} className="text-xs rounded px-2 py-0.5 bg-[#1c1f27] text-[#9da6b9] border border-[#3b4354]">{label}</span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleCreate} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Thêm phòng</Button>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {rooms?.map((r: any) => (
          <Card key={r.id} variant="dark" className="p-4 border-[#3b4354]">
            <p className="font-semibold text-white">{r.id}</p>
            <p className="text-sm text-[#9da6b9]">Sức chứa: {r.capacity} học viên</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
