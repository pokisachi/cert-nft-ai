'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import type { AnnouncementsResponse, AnnouncementItem } from '../hooks/types';

const PAGE_SIZE = 20;

function AnnouncementsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const onlyUnread = params.get('unread') === '1';
  const scope = (params.get('scope') || '') as '' | 'global' | 'course' | 'personal';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me', 'announcements', { page, onlyUnread, scope }],
    queryFn: async (): Promise<AnnouncementsResponse> => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL('/api/me/announcements', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      if (onlyUnread) url.searchParams.set('unread', '1');
      if (scope) url.searchParams.set('scope', scope);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('fetch announcements failed');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const qc = useQueryClient();
  const markRead = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/me/announcements/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      }).then((r) => {
        if (!r.ok) throw new Error('patch failed');
        return r.json();
      }),
    onMutate: async (id: number) => {
      const key = ['me', 'announcements', { page, onlyUnread, scope }];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AnnouncementsResponse>(key);
      if (prev) {
        qc.setQueryData<AnnouncementsResponse>(key, {
          ...prev,
          items: prev.items.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        });
      }
      return { prev, key };
    },
    onError: (_e, _id, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      alert('Không thể cập nhật thông báo. Vui lòng thử lại.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'announcements'] });
    },
  });

  const setParam = (kv: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    Object.entries(kv).forEach(([k, v]) => (v === null ? q.delete(k) : q.set(k, v)));
    router.push(`/me/announcements?${q.toString()}`);
  };

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Tất cả thông báo</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={scope}
              onChange={(e) => setParam({ scope: e.target.value || '', page: '1' })}
              aria-label="Lọc phạm vi"
            >
              <option value="">Tất cả phạm vi</option>
              <option value="global">global</option>
              <option value="course">course</option>
              <option value="personal">personal</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setParam({ unread: e.target.checked ? '1' : null, page: '1' })}
              />
              Chỉ chưa đọc
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Đã có lỗi xảy ra.</AlertTitle>
              <AlertDescription><Button variant="link" onClick={() => refetch()}>Thử lại</Button></AlertDescription>
            </Alert>
          ) : (data?.items.length || 0) === 0 ? (
            <p className="py-6 text-sm text-gray-600">Chưa có thông báo.</p>
          ) : (
            <>
              <ul className="divide-y">
                {data!.items.map((a: AnnouncementItem) => (
                  <li key={a.id} className="flex items-start justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{a.title}</p>
                        {!a.isRead && <Badge>NEW</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{dayjs(a.createdAt).format('DD/MM/YYYY HH:mm')} • {a.scope}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-700">{a.content}</p>
                    </div>
                    {!a.isRead && (
                      <Button size="sm" variant="outline" onClick={() => markRead.mutate(a.id)} aria-label={`Đánh dấu ${a.id} đã đọc`}>
                        Đánh dấu đã đọc
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
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

export default function AnnouncementsListPage() {
  return (
    <Suspense fallback={<main className="p-6">Đang tải...</main>}>
      <AnnouncementsContent />
    </Suspense>
  );
}
