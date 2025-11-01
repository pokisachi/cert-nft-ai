"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import SafeReactQuill from "@/components/SafeReactQuill";





const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};


const CourseSchema = z.object({
  title: z.string().min(3, "Tên khóa học bắt buộc"),
  category: z.string().min(2, "Danh mục bắt buộc"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  examDateExpected: z.string().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CLOSED"]),
  isPublic: z.boolean(),
  thumbnail: z.string().optional(),
});

type CourseFormData = z.infer<typeof CourseSchema>;

interface CourseFormProps {
  mode: "create" | "edit";
  id?: string;
}

export function CourseForm({ mode, id }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(""); // 👈 preview riêng

  const form = useForm<CourseFormData>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      startDate: "",
      endDate: "",
      examDateExpected: "",
      status: "UPCOMING",
      isPublic: true,
      thumbnail: "",
    },
  });

  // ✅ Load dữ liệu khi edit
  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        const res = await fetch(`/api/admin/courses/${id}`);
        if (res.ok) {
          const data = await res.json();
          form.reset({
            title: data.title ?? "",
            category: data.category ?? "",
            description: data.description ?? "",
            startDate: data.startDate ? data.startDate.slice(0, 10) : "",
            endDate: data.endDate ? data.endDate.slice(0, 10) : "",
            examDateExpected: data.examDateExpected
              ? data.examDateExpected.slice(0, 10)
              : "",
            status: data.status ?? "UPCOMING",
            isPublic: data.isPublic ?? true,
            thumbnail: data.thumbnail ?? "",
          });
          if (data.thumbnail) setPreviewUrl(data.thumbnail);
        }
      })();
    }
  }, [mode, id, form]);

  // ✅ Upload thật + preview đúng cách
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị preview tạm
    const blobPreview = URL.createObjectURL(file);
    setPreviewUrl(blobPreview);

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Định dạng ảnh không hợp lệ",
        description: "Chỉ chấp nhận PNG, JPG, WEBP",
        variant: "destructive",
      });
      return;
    }

    // Upload lên server (API /api/upload)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "courses");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.url) {
        form.setValue("thumbnail", data.url); // ✅ URL thật (VD: /courses/1760798198172.png)
        setPreviewUrl(data.url); // cập nhật preview thật
        toast({ title: "Ảnh tải lên thành công!" });
      } else {
        toast({
          title: "Upload ảnh thất bại",
          description: data?.error ?? "Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi kết nối server upload",
        variant: "destructive",
      });
    }
  };

  // ✅ Gửi dữ liệu tạo/sửa khóa học
  const onSubmit: SubmitHandler<CourseFormData> = async (values) => {
    setLoading(true);
    const method = mode === "create" ? "POST" : "PUT";
    const url =
      mode === "create"
        ? "/api/admin/courses"
        : `/api/admin/courses/${id}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);

    if (res.ok) {
      toast({
        title:
          mode === "create"
            ? "Tạo khóa học thành công 🎉"
            : "Cập nhật khóa học thành công ✅",
      });
      router.push("/admin/courses");
    } else {
      const data = await res.json();
      toast({
        title: "Lỗi khi lưu dữ liệu",
        description: data?.error || "Không thể lưu khóa học",
        variant: "destructive",
      });
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-6 rounded-md shadow-sm border"
    >
      <div>
        <label className="block font-medium mb-1">Tên khóa học *</label>
        <Input placeholder="VD: Blockchain Cơ Bản" {...form.register("title")} />
      </div>

      <div>
        <label className="block font-medium mb-1">Danh mục *</label>
        <Input placeholder="VD: Công nghệ" {...form.register("category")} />
      </div>
        <div>
          <label className="block font-medium mb-1">Mô tả chi tiết</label>
          <div className="border rounded-md">
            <SafeReactQuill
              value={form.watch("description") || ""}
              onChange={(value: string) => form.setValue("description", value)}
            />
          </div>
        </div>



      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Ngày bắt đầu</label>
          <Input type="date" {...form.register("startDate")} />
        </div>
        <div>
          <label className="block font-medium mb-1">Ngày kết thúc</label>
          <Input type="date" {...form.register("endDate")} />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Ngày thi dự kiến</label>
        <Input type="date" {...form.register("examDateExpected")} />
      </div>

      <div>
        <label className="block font-medium mb-1">Trạng thái *</label>
        <select
          {...form.register("status")}
          className="border rounded p-2 w-full"
        >
          <option value="UPCOMING">UPCOMING</option>
          <option value="ONGOING">ONGOING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...form.register("isPublic")} />
        <label>Công khai khóa học</label>
      </div>

      {/* ✅ Upload ảnh thật + preview */}
      <div>
        <label className="block font-medium mb-1">Hình thu nhỏ</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="border p-2 rounded w-full"
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 w-40 h-28 object-cover border rounded"
          />
        )}
      </div>

      <Button disabled={loading} type="submit" className="w-full">
        {loading
          ? "Đang xử lý..."
          : mode === "create"
          ? "Tạo khóa học"
          : "Cập nhật khóa học"}
      </Button>
    </form>
  );
}
