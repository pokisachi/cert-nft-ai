import { CourseForm } from "../_components/CourseForm";

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-4">Chỉnh sửa khóa học #{id}</h1>
      <CourseForm mode="edit" id={id} />
    </div>
  );
}
