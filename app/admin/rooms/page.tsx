"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminRoomsPage() {
  const { data: rooms, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Không thể tải danh sách phòng học");
      return res.json();
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa phòng học này?")) return;
    const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa phòng học!");
      refetch();
    } else toast.error("Lỗi khi xóa phòng học");
  }

  return (
    <main className="max-w-5xl mx-auto mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">🏫 Danh sách Phòng học</h1>
        <Link href="/admin/rooms/new">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            ➕ Thêm Phòng
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms?.map((r: any) => (
          <Card key={r.id} className="p-4 space-y-2">
            <p className="font-semibold text-lg">Phòng {r.id}</p>
            <p className="text-sm text-gray-600">Sức chứa: {r.capacity}</p>

            <div className="flex flex-wrap gap-1">
              {r.availability?.map((slot: string) => (
                <Badge key={slot}>{slot}</Badge>
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              <Link href={`/admin/rooms/${r.id}/edit`}>
                <Button variant="outline">✏️ Sửa</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => handleDelete(r.id)}
              >
                🗑️ Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
