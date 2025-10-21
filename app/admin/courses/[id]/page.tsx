import { CourseForm } from "../_components/CourseForm";
import { use } from "react";

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-4">Chỉnh sửa khóa học #{id}</h1>
      <CourseForm mode="edit" id={id} />
    </div>
  );
}
