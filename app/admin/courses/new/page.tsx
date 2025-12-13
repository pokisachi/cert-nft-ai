"use client";
import { CourseForm } from "../_components/CourseForm";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tạo khóa học mới</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
              onClick={() => router.push("/admin/courses")}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              form="course-form"
              type="submit"
            >
              Tạo khóa học
            </Button>
          </div>
        </div>

        <CourseForm mode="create" />
      </div>
    </main>
  );
}
