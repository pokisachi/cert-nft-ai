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
    <main className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">✏️ Sửa Phòng học {roomId}</h1>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Sức chứa:</label>
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>

        <Button onClick={handleUpdate}>💾 Lưu thay đổi</Button>
        <Button variant="destructive" onClick={handleDelete}>
          🗑️ Xóa Phòng học
        </Button>
      </Card>
    </main>
  );
}
