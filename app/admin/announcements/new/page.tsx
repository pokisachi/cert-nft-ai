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
  const { register, handleSubmit, formState, watch } = useForm({
    resolver: zodResolver(schema),
  });
  const [typeSelect, setTypeSelect] = useState<string>("Hệ thống");

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

  const titlePreview = watch("title");
  const contentPreview = watch("content");
  const rolePreview = watch("targetRole");
  const pinnedPreview = watch("isPinned");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full max-w-[1920px] mx-auto p-6">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tạo thông báo mới</h1>
          <p className="text-sm text-gray-600">Soạn thảo và cấu hình thông báo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tiêu đề thông báo</label>
                <Input {...register("title")} placeholder="Nhập tiêu đề..." className="rounded-lg text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Nội dung chi tiết</label>
                <textarea {...register("content")} placeholder="Nhập nội dung..." className="rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-[300px] w-full" />
              </div>
            </form>
          </Card>

          <div className="space-y-8">
            <Card className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Đối tượng nhận</label>
                  <select {...register("targetRole")} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 w-full">
                    <option value="LEARNER">Học viên</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ALL">Tất cả</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Loại thông báo</label>
                  <select value={typeSelect} onChange={(e) => setTypeSelect(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 w-full">
                    <option>Hệ thống</option>
                    <option>Học tập</option>
                    <option>Khuyến mãi</option>
                    <option>Sự kiện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Gán khóa học</label>
                  <select {...register("courseId")} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 w-full">
                    <option value="">Không gán khóa học</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.title} (#{c.id})
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" {...register("isPinned")} className="rounded-sm" />
                  Ghim lên đầu trang chủ
                </label>
              </div>
            </Card>

            <Card className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Mockup preview</h3>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">{new Date().toLocaleString("vi-VN")}</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">{typeSelect}</div>
                  <div className="font-semibold text-gray-900">{titlePreview || "Tiêu đề thông báo"}</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{contentPreview || "Nội dung chi tiết sẽ hiển thị tại đây."}</div>
                  <div className="mt-3 text-xs text-gray-500">
                    {rolePreview === "LEARNER" ? "Gửi đến: Học viên" : rolePreview === "ADMIN" ? "Gửi đến: Admin" : "Gửi đến: Tất cả"}
                    {pinnedPreview ? " • Được ghim" : ""}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>Gửi thông báo</Button>
                  <Button variant="outline" onClick={() => alert("Lưu nháp thành công")}>Lưu nháp</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
