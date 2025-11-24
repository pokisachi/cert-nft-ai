"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [courses, setCourses] = useState<any[]>([]);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      setCourses(json.data || json);
    })();
  }, []);

  const onSubmit = async (values: any) => {
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, courseId: values.courseId || null }),
    });
    if (res.ok) {
      alert("Thông báo đã được phát hành!");
      router.push("/admin/announcements");
    }
  };

  return (
    <main className="p-6 bg-[#111318] min-h-[calc(100vh-64px)]">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-white">Tạo thông báo mới</h1>
        <Card variant="dark" className="p-6 border-[#3b4354]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Input {...register("title")} placeholder="Tiêu đề" className="border border-[#3b4354] bg-[#12151b] text-white" />
            <textarea {...register("content")} placeholder="Nội dung" className="rounded-md border border-[#3b4354] bg-[#12151b] text-white px-3 py-2 h-32" />
            <select {...register("targetRole")} className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2">
              <option value="LEARNER">LEARNER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ALL">ALL</option>
            </select>
            <select {...register("courseId")} className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2">
              <option value="">Không gán khóa học</option>
              {courses.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title} (#{c.id})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" {...register("isPinned")} className="rounded-sm" />
              Hiển thị nổi bật (trang chủ)
            </label>
            <Button type="submit" disabled={formState.isSubmitting} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Lưu thông báo</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
