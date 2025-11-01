"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

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

  async function handleCreate() {
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, capacity }),
    });

    if (res.ok) {
      toast.success("Đã thêm phòng học!");
      setId("");
      setCapacity(0);
      refetch();
    } else {
      toast.error("Lỗi khi thêm phòng học");
    }
  }

  return (
    <main className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-6">🏫 Quản lý Phòng học</h1>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Mã phòng (vd: A101)"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <Input
          placeholder="Sức chứa"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <Button onClick={handleCreate}>Thêm</Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rooms?.map((r: any) => (
          <Card key={r.id} className="p-4">
            <p className="font-semibold">{r.id}</p>
            <p className="text-sm text-gray-600">
              Sức chứa: {r.capacity} học viên
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}
