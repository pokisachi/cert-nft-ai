'use client';

import { useMyAnnouncements } from '../hooks/useMyAnnouncements';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
// import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, markRead, markAllRead } = useMyAnnouncements(10);

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
    <main className="px-6 py-6 bg-[#111318] min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Tất cả thông báo</h1>
          <Button
            variant="outline"
            className="border-[#3b4354] text-white"
            disabled={!data || data.unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            title="Đánh dấu đọc tất cả"
          >
            Đánh dấu đã đọc tất cả
          </Button>
        </div>

        {items.length ? (
          <div className="space-y-3">
            {items.map((a) => (
              <Card
                key={a.id}
                variant="dark"
                className={`border-[#3b4354] transition hover:border-indigo-500/40 hover:bg-[#242833] ${!a.isRead ? 'border-indigo-500/40 bg-[#242833]' : ''}`}
                onClick={() => (!a.isRead ? markRead.mutate(a.id) : null)}
                role="button"
                tabIndex={0}
              >
                <CardHeader className="border-[#3b4354]">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">{a.title}</CardTitle>
                    {!a.isRead && <span className="text-xs rounded px-2 py-0.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/40">NEW</span>}
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-[#9da6b9]">
                  <p className="leading-relaxed">{a.content}</p>
                  <p className="text-xs text-[#7f889c] mt-2">
                    {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </CardContent>
                {/* Footer bỏ nút riêng; click card sẽ đánh dấu đọc */}
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="bg-[#1c1f27] text-white border-[#3b4354]">Không có thông báo nào.</Alert>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            className="border-[#3b4354] text-white"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Trang trước
          </Button>
          <span className="text-sm text-[#9da6b9]">Trang {page}</span>
          <Button variant="outline" className="border-[#3b4354] text-white" onClick={() => setPage((p) => p + 1)} disabled={items.length < 10}>
            Trang sau
          </Button>
        </div>
      </div>
    </main>
  );
}
