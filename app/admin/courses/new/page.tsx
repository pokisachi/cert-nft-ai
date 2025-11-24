"use client";
import { CourseForm } from "../_components/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold mb-6">Tạo khóa học mới</h1>
        <div className="max-w-4xl mx-auto">
          <CourseForm mode="create" />
        </div>
      </div>
    </div>
  );
}
