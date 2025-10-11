'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CourseDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error('Không thể tải thông tin khóa học.');
      return res.json();
    },
  });

  if (isLoading)
    return (
      <main className="max-w-4xl mx-auto p-8">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </main>
    );

  if (isError)
    return (
      <main className="max-w-4xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không thể tải thông tin khóa học.</AlertDescription>
        </Alert>
      </main>
    );

  return (
    <main className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-100">
            {data.thumbnail ? (
              <Image src={data.thumbnail} alt={data.title} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">{data.description}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📅 Bắt đầu: {data.startDate ? dayjs(data.startDate).format('DD/MM/YYYY') : '-'}</p>
            <p>🏁 Kết thúc: {data.endDate ? dayjs(data.endDate).format('DD/MM/YYYY') : '-'}</p>
            <p>🧮 Ngày thi dự kiến: {data.examDateExpected ? dayjs(data.examDateExpected).format('DD/MM/YYYY') : '-'}</p>
            <p>📚 Danh mục: {data.category || '-'}</p>
          </div>
          <div className="flex gap-4 mt-8">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Đăng ký khóa học
            </Button>
            <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
              Tư vấn
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
