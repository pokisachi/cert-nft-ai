'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { CourseStatus } from '@prisma/client';

const statusColor: Record<CourseStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CLOSED: 'bg-slate-100 text-slate-700',
};

export default function CoursesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public', 'courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Không thể tải danh sách khóa học.');
      return res.json();
    },
  });

  const courses = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white text-center py-16 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-indigo-700 mb-4"
        >
          Khóa học Public
        </motion.h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Khám phá các khóa học nổi bật được phát hành công khai.
          Học tập minh bạch, xác thực bằng chứng chỉ NFT!
        </p>
      </section>

      <main className="container mx-auto max-w-7xl px-6 py-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="max-w-lg mx-auto text-center">
            <AlertTitle>Đã có lỗi xảy ra</AlertTitle>
            <AlertDescription>
              <Button variant="link" onClick={() => refetch()}>
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        ) : courses.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Hiện chưa có khóa học public nào.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course: any, i: number) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-gray-100 shadow-sm bg-white hover:shadow-lg transition overflow-hidden"
              >
                {/* ✅ Hiển thị ảnh với field thumbnailUrl */}
                <div className="relative w-full h-44 bg-gray-100">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Không có ảnh
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col justify-between h-52">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {course.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        statusColor[course.status as CourseStatus]
                      }`}
                    >
                      {course.status}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm text-indigo-600 hover:underline font-medium"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
