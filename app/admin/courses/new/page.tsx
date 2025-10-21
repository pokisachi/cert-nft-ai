"use client";
import { CourseForm } from "../_components/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Thêm khóa học mới</h1>
      <CourseForm mode="create" />
    </div>
  );
}
