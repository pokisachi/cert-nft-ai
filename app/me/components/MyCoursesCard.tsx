'use client';

import { useMyCourses } from '../hooks/useMyCourses';
import { fmtDate } from '@/lib/date';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CourseRow } from '../hooks/types';

const statusStyle: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-slate-100 text-slate-800',
};

export default function MyCoursesCard() {
  const { data, isLoading, isError, refetch } = useMyCourses(5);

  return (
    <Card variant="dark" className="border border-[#3b4354]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#3b4354]">
        <CardTitle className="text-base font-semibold text-white">{t('myCourses')}</CardTitle>
        <Link href="/me/courses" className="text-sm underline text-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>
              <button
                onClick={() => refetch()}
                className="mt-2 underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Retry fetch courses"
              >
                {t('retry')}
              </button>
            </AlertDescription>
          </Alert>
        ) : (data?.items?.length || 0) === 0 ? (
          <div className="py-4">
            <p className="text-sm text-gray-600">{t('empty_courses')}</p>
            <Link href="/courses" className="mt-2 inline-flex text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2">
              {t('registerCourse')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table variant="dark">
            <TableHeader variant="dark">
              <TableRow variant="dark">
                <TableHead variant="dark">Course</TableHead>
                <TableHead variant="dark">Start</TableHead>
                <TableHead variant="dark">End</TableHead>
                <TableHead variant="dark">Status</TableHead>
                <TableHead variant="dark">Exam date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.items.slice(0, 5).map((c: CourseRow) => (
                <TableRow key={c.id} variant="dark">
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{fmtDate(c.startDate)}</TableCell>
                  <TableCell>{fmtDate(c.endDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
                        c.status === 'UPCOMING' ? 'bg-blue-900/30 text-blue-300 border-blue-600/40' :
                        c.status === 'ONGOING' ? 'bg-green-900/30 text-green-300 border-green-600/40' :
                        c.status === 'COMPLETED' ? 'bg-gray-900/30 text-gray-300 border-gray-600/40' :
                        'bg-slate-900/30 text-slate-300 border-slate-600/40'
                      }`}
                      role="status"
                      aria-label={`status ${c.status}`}
                    >
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell>{fmtDate(c.examDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        )}
      </CardContent>
    </Card>
  );
}
