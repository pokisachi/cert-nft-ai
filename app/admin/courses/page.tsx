"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import CourseTable from "./_components/CourseTable";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CoursesPage() {
  const { data, mutate } = useSWR("/api/admin/courses", fetcher);

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý khóa học</h1>
        <Button onClick={() => (window.location.href = "/admin/courses/new")}>
          ➕ Thêm khóa học mới
        </Button>
      </div>

      <CourseTable data={data} onDeleted={mutate} />
    </div>
  );
}
