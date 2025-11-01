"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminTeachersPage() {
  const { data: teachers, refetch } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Không thể tải danh sách giảng viên");
      return res.json();
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa giảng viên này?")) return;
    const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa giảng viên!");
      refetch();
    } else toast.error("Lỗi khi xóa giảng viên");
  }

  return (
    <main className="max-w-5xl mx-auto mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">👨‍🏫 Danh sách Giảng viên</h1>
        <Link href="/admin/teachers/new">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            ➕ Thêm Giảng viên
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers?.map((t: any) => (
          <Card key={t.id} className="p-4 space-y-2">
            <p className="font-semibold text-lg">{t.name}</p>
            <p className="text-sm text-gray-600">
              <strong>Chuyên môn:</strong> {t.qualifications?.join(", ") || "Chưa có"}
            </p>

            <div className="flex flex-wrap gap-1">
              {t.availability?.map((slot: string) => (
                <Badge key={slot}>{slot}</Badge>
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              <Link href={`/admin/teachers/${t.id}/edit`}>
                <Button variant="outline">✏️ Sửa</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => handleDelete(t.id)}
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
