"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import Image from "next/image";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
});

type LearnerDetail = {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  walletAddress?: string | null;
  avatarUrl?: string | null;
  _count: {
    examResults: number;
    certificates: number;
  };
};

type LearnerUpdatePayload = {
  name: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
};

export default function LearnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<LearnerDetail>({
    queryKey: ["learner", id],
    queryFn: () => fetcher<LearnerDetail>(`/api/admin/learners/${id}`),
  });

  const form = useForm<LearnerUpdatePayload>({
    resolver: zodResolver(schema),
    values: {
      name: data?.name || "",
      phone: data?.phone || "",
      address: data?.address || "",
      avatarUrl: data?.avatarUrl || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LearnerUpdatePayload) =>
      fetcher(`/api/admin/learners/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      refetch();
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  if (isLoading) return <p className="p-6 text-gray-500 text-center">Đang tải...</p>;
  if (!data) return <p className="p-6 text-gray-500 text-center">Không tìm thấy học viên.</p>;

  const isSaving =
    (mutation as any).isPending ||
    (mutation as any).status === "pending" ||
    false;

  const copyWallet = async () => {
    if (data.walletAddress) {
      await navigator.clipboard.writeText(data.walletAddress);
      toast.success("Đã sao chép địa chỉ ví");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 🧩 Upload avatar thật
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok && result.url) {
      form.setValue("avatarUrl", result.url);
      setPreview(result.url);
      toast.success("Tải ảnh lên thành công!");
    } else {
      toast.error("Không thể tải ảnh lên");
    }
  };

  return (
    <div className="min-h-[85vh] flex justify-center items-start p-6 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Thông tin học viên</h2>

        <div className="space-y-3 mb-6 text-sm text-gray-700">
          <p>
            <strong>Email:</strong> {data.email}
          </p>
          <p>
            <strong>Địa chỉ ví:</strong>{" "}
            {data.walletAddress ? (
              <>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {data.walletAddress}
                </code>
                <Button size="sm" variant="outline" onClick={copyWallet} className="ml-2">
                  {copied ? "✓ Đã copy" : "Copy"}
                </Button>
              </>
            ) : (
              <span className="italic text-gray-400">Chưa liên kết</span>
            )}
          </p>
          <p>
            <strong>Khóa học tham gia:</strong> {data._count.examResults}
          </p>
          <p>
            <strong>Chứng chỉ đã cấp:</strong> {data._count.certificates}
          </p>
        </div>

        {/* 🧩 Form cập nhật thông tin */}
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values as LearnerUpdatePayload)
          )}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <Input {...form.register("name")} placeholder="Nhập họ tên" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <Input {...form.register("phone")} placeholder="Nhập số điện thoại" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <Input {...form.register("address")} placeholder="Nhập địa chỉ" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-600"
            />
            {(preview || form.watch("avatarUrl")) && (
              <div className="mt-3 flex flex-col items-center">
                <Image
                  src={preview || (form.watch("avatarUrl") as string)}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="rounded-full border"
                />
                <span className="text-xs text-gray-500 mt-1">Ảnh hiện tại</span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button type="submit" disabled={isSaving} className="px-6">
              {isSaving ? "Đang lưu..." : "💾 Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
