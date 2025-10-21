"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  targetRole: z.string().min(1),
  courseId: z.string().optional(),
  isPinned: z.boolean().optional(),
});

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: any) => {
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      alert("Thông báo đã được phát hành!");
      router.push("/admin/announcements");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">➕ Tạo thông báo mới</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <input {...register("title")} placeholder="Tiêu đề" className="border rounded px-2 py-1" />
        <textarea {...register("content")} placeholder="Nội dung" className="border rounded px-2 py-2 h-32" />
        <select {...register("targetRole")} className="border rounded px-2 py-1">
          <option value="LEARNER">LEARNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ALL">ALL</option>
        </select>
        <input {...register("courseId")} placeholder="ID khóa học (tùy chọn)" className="border rounded px-2 py-1" />
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("isPinned")} />
          Hiển thị nổi bật (trang chủ)
        </label>
        <Button type="submit" disabled={formState.isSubmitting}>Lưu thông báo</Button>
      </form>
    </div>
  );
}
