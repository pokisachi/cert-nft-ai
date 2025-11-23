'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
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

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 bg-[#111318] text-white">
      <Card variant="dark" className="border border-[#3b4354]">
        <CardHeader className="flex items-center justify-between border-b border-[#3b4354]">
          <CardTitle className="text-lg font-semibold text-white">Tất cả khóa học của tôi</CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter trạng thái */}
            <select
              className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={status}
              onChange={(e) => setParam({ status: e.target.value || '', page: '1' })}
              aria-label="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Đã có lỗi xảy ra.</AlertTitle>
              <AlertDescription>
                <Button variant="link" onClick={() => refetch()}>Thử lại</Button>
              </AlertDescription>
            </Alert>
          ) : (data?.items.length || 0) === 0 ? (
            <p className="py-6 text-sm text-gray-600">Chưa có khóa học.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table variant="dark">
                  <TableHeader variant="dark">
                    <TableRow variant="dark">
                      <TableHead variant="dark">Khóa học</TableHead>
                      <TableHead variant="dark">Bắt đầu</TableHead>
                      <TableHead variant="dark">Kết thúc</TableHead>
                      <TableHead variant="dark">Trạng thái</TableHead>
                      <TableHead variant="dark">Ngày thi dự kiến</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.items.map((c: CourseRow) => (
                      <TableRow key={c.id} variant="dark">
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.startDate ? dayjs(c.startDate).format('DD/MM/YYYY') : '-'}</TableCell>
                        <TableCell>{c.endDate ? dayjs(c.endDate).format('DD/MM/YYYY') : '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
                            c.status === 'UPCOMING' ? 'bg-blue-900/30 text-blue-300 border-blue-600/40' :
                            c.status === 'ONGOING' ? 'bg-green-900/30 text-green-300 border-green-600/40' :
                            c.status === 'COMPLETED' ? 'bg-gray-900/30 text-gray-300 border-gray-600/40' :
                            'bg-slate-900/30 text-slate-300 border-slate-600/40'
                          }`}>
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell>{c.examDate ? dayjs(c.examDate).format('DD/MM/YYYY') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data!.total}
                onPageChange={(p) => setParam({ page: String(p) })}
              />
            </>
          )}
        </CardContent>
      </Card>
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
