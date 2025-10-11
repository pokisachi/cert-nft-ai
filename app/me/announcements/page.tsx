'use client';

import { useMyAnnouncements } from '../hooks/useMyAnnouncements';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, markRead } = useMyAnnouncements(10);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError)
    return (
      <Alert variant="destructive">
        <p>Đã có lỗi xảy ra khi tải thông báo.</p>
        <Button variant="link" onClick={() => refetch()}>
          Thử lại
        </Button>
      </Alert>
    );

  // ✅ An toàn: fallback mảng rỗng nếu chưa có data
  const items = data?.items ?? [];

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Tất cả thông báo</h1>

      {items.length ? (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className={`border p-4 rounded-md transition hover:bg-muted/30 ${
                !a.isRead ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{a.title}</h2>
                {!a.isRead && <Badge variant="default">NEW</Badge>}
              </div>

              <p className="text-sm text-gray-700 mt-1">{a.content}</p>

              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>

              {!a.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => markRead.mutate(a.id)}
                >
                  Đánh dấu đã đọc
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Alert>Không có thông báo nào.</Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Trang trước
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={items.length < 10}>
          Trang sau
        </Button>
      </div>
    </div>
  );
}
