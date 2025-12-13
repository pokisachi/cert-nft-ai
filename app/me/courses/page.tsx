'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { CalendarDays, BookOpen } from 'lucide-react';
import type { CoursesResponse, CourseRow, CourseStatus } from '../hooks/types';

const statusStyle: Record<CourseStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-slate-100 text-slate-800',
};

const PAGE_SIZE = 20;

function CoursesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const status = (params.get('status') || '') as '' | CourseStatus;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me', 'courses', { page, status }],
    queryFn: async (): Promise<CoursesResponse> => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL('/api/me/courses', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      if (status) url.searchParams.set('status', status);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('fetch courses failed');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const setParam = (kv: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    Object.entries(kv).forEach(([k, v]) => (v === null ? q.delete(k) : q.set(k, v)));
    router.push(`/me/courses?${q.toString()}`);
  };

  const items = data?.items || [];
  const soonExam = (d?: string) => {
    if (!d) return false;
    const diff = dayjs(d).diff(dayjs(), 'day');
    return diff >= 0 && diff <= 7;
  };

  const setStatusTab = (tab: 'all' | 'ongoing' | 'completed') => {
    const s = tab === 'ongoing' ? 'ONGOING' : tab === 'completed' ? 'COMPLETED' : '';
    setParam({ status: s, page: '1' });
  };

  const thumb = (c: CourseRow, i: number) => {
    const anyC = c as any;
    return c.thumbnailUrl || anyC.thumbnail || anyC.image || `https://picsum.photos/seed/mycourse-${c.id || i}/800/450`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Khóa học của tôi</h1>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setStatusTab('all')}
            className={`px-4 py-2 rounded-xl border ${!status ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusTab('ongoing')}
            className={`px-4 py-2 rounded-xl border ${status === 'ONGOING' ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
          >
            Đang học
          </button>
          <button
            onClick={() => setStatusTab('completed')}
            className={`px-4 py-2 rounded-xl border ${status === 'COMPLETED' ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
          >
            Đã hoàn thành
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div>Đã có lỗi xảy ra.</div>
            <Button variant="outline" className="mt-3 border-gray-300" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center">
            <BookOpen className="h-12 w-12 text-gray-300" />
            <div className="mt-3 text-gray-800 font-medium">Bạn chưa đăng ký khóa học nào</div>
            <Link href="/" className="mt-4 inline-flex">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Khám phá khóa học mới</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((c: CourseRow, idx) => (
                <div key={c.id} className="relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                  <div className="relative w-full pb-[56.25%]">
                    <img src={thumb(c, idx)} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 pr-14">{c.title}</h3>
                      <span className={`absolute top-4 right-4 text-xs px-2 py-1 rounded-full border ${
                        c.status === 'ONGOING' ? 'bg-green-100 text-green-700 border-green-200' :
                        c.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                        c.status === 'UPCOMING' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>{c.status}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4" />
                      <span>{c.startDate ? dayjs(c.startDate).format('DD/MM/YYYY') : '-'}</span>
                      <span>-</span>
                      <span>{c.endDate ? dayjs(c.endDate).format('DD/MM/YYYY') : '-'}</span>
                    </div>

                    <div className={`mt-2 text-sm ${soonExam(c.examDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Ngày thi dự kiến: {c.examDate ? dayjs(c.examDate).format('DD/MM/YYYY') : '-'}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Tiến độ</span>
                        <span>{typeof (c as any).progress === 'number' ? (c as any).progress : 0}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-green-600" style={{ width: `${typeof (c as any).progress === 'number' ? (c as any).progress : 0}%` }} />
                      </div>
                    </div>

                    <Link href={`/courses/${c.id}`} className="mt-4 block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Vào học</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data!.total}
                onPageChange={(p) => setParam({ page: String(p) })}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function CoursesListPage() {
  return (
    <Suspense fallback={<main className="p-6">Đang tải...</main>}>
      <CoursesContent />
    </Suspense>
  );
}
