"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminQualificationsPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // ✅ Lấy danh sách chuyên môn
  const { data: qualifications, refetch, isLoading } = useQuery({
    queryKey: ["qualifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/qualifications");
      if (!res.ok) throw new Error("Không thể tải danh sách chuyên môn");
      return res.json();
    },
  });

  // ✅ Tạo chuyên môn mới
  const createQualification = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description }),
      });
      if (!res.ok) throw new Error("Không thể thêm chuyên môn");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Thêm chuyên môn thành công!");
      setName("");
      setCategory("");
      setDescription("");
      refetch();
    },
    onError: () => {
      toast.error("Lỗi khi thêm chuyên môn");
    },
  });

  // ✅ Xóa chuyên môn
  const deleteQualification = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/qualifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Không thể xóa chuyên môn");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã xóa chuyên môn");
      refetch();
    },
    onError: () => {
      toast.error("Lỗi khi xóa chuyên môn");
    },
  });

  return (
    <main className="max-w-5xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">📘 Quản lý Chuyên môn</h1>

      {/* Form thêm chuyên môn */}
      <Card className="p-6 mb-8 space-y-3">
        <div>
          <Input
            placeholder="Tên chuyên môn (VD: TOEIC 450+)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Input
            placeholder="Phân loại (VD: TOEIC, IELTS, TIN_HOC...)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div>
          <Input
            placeholder="Mô tả chi tiết (tuỳ chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button
          onClick={() => createQualification.mutate()}
          disabled={!name || !category}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          ➕ Thêm chuyên môn
        </Button>
      </Card>

      {/* Danh sách chuyên môn */}
      {isLoading ? (
        <p>Đang tải...</p>
      ) : qualifications?.length === 0 ? (
        <p className="text-gray-500">Chưa có chuyên môn nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualifications.map((q: any) => (
            <Card key={q.id} className="p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold">{q.name}</p>
                <p className="text-sm text-gray-600">Loại: {q.category}</p>
                {q.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {q.description}
                  </p>
                )}
              </div>

              <Button
                variant="destructive"
                onClick={() => deleteQualification.mutate(q.id)}
              >
                Xóa
              </Button>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
