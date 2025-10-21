"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { useState } from "react";
import Image from "next/image";

const schema = z.object({
  name: z.string().min(1, "Họ tên là bắt buộc"),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type LearnerFormValues = z.infer<typeof schema>;

interface LearnerFormProps {
  id: number | string;
  mode?: "admin" | "self";
  initialData: {
    name: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  };
  onSaved?: () => void;
}

export function LearnerForm({
  id,
  mode = "admin",
  initialData,
  onSaved,
}: LearnerFormProps) {
  const form = useForm<LearnerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      avatarUrl: initialData?.avatarUrl || "",
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(initialData?.avatarUrl || "");

  // ✅ Hàm submit form
  const onSubmit = async (values: LearnerFormValues) => {
    try {
      setIsSaving(true);

      const url =
        mode === "self" ? `/api/me/profile` : `/api/admin/learners/${id}`;

      await fetcher(url, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      toast.success("Lưu thay đổi thành công 🎉");
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu thay đổi ❌");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Xử lý upload ảnh
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        form.setValue("avatarUrl", data.url); // cập nhật form
        setPreview(data.url); // cập nhật ảnh preview
        toast.success("Tải ảnh lên thành công ✅");
        window.dispatchEvent(new Event("user-updated"));
      } else {
        toast.error(data.error || "Không thể tải ảnh lên");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Lỗi khi tải ảnh lên máy chủ ❌");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-6 rounded-md shadow-sm border"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Họ tên:
        </label>
        <Input {...form.register("name")} placeholder="Nhập họ tên" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại:
        </label>
        <Input {...form.register("phone")} placeholder="Nhập số điện thoại" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ:
        </label>
        <Input {...form.register("address")} placeholder="Nhập địa chỉ" />
      </div>

      {/* ✅ Upload ảnh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ảnh đại diện:
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />

        {uploading && (
          <p className="text-xs text-gray-500 mt-1 animate-pulse">
            Đang tải ảnh lên...
          </p>
        )}

        {preview && (
          <div className="mt-3 flex items-center gap-3">
            <Image
              src={preview}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-avatar.png";
              }}
            />
            <p className="text-xs text-gray-500">Ảnh hiện tại</p>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSaving || uploading}>
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
