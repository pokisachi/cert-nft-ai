"use client";

import { useQuery } from "@tanstack/react-query";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string;
  startDate?: string;
  instructor?: string;
}

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error("Không thể tải danh sách khóa học.");
      return res.json();
    },
  });
}
