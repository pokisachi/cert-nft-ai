"use client";

import { useMyAnnouncements } from "../me/hooks/useMyAnnouncements";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays, AlertTriangle, PartyPopper } from "lucide-react";
import Link from "next/link";

function IconFor(a: { title?: string; scope?: string }) {
  const title = (a.title || "").toLowerCase();
  if (title.includes("cảnh báo") || title.includes("warning") || title.includes("lỗi")) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
  if (title.includes("lịch") || title.includes("schedule") || a.scope === "course") return <CalendarDays className="h-5 w-5 text-blue-600" />;
  return <PartyPopper className="h-5 w-5 text-green-600" />;
}

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch, markRead, markAllRead } = useMyAnnouncements(100);

  if (isLoading)
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );

  if (isError)
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div>Đã có lỗi xảy ra khi tải thông báo.</div>
            <Button variant="outline" className="mt-3 border-gray-300" onClick={() => refetch()}>Thử lại</Button>
          </div>
        </div>
      </main>
    );

  const items = data?.items ?? [];

  const groups: Record<string, typeof items> = { today: [], yesterday: [], older: [] };
  for (const a of items) {
    const d = new Date(a.createdAt);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) groups.today.push(a);
    else if (days === 1) groups.yesterday.push(a);
    else groups.older.push(a);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tất cả thông báo</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-gray-300"
              disabled={!data || data.unreadCount === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Đánh dấu đã đọc tất cả
            </Button>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Quay về</Link>
          </div>
        </div>

        {!items.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-700">Không có thông báo nào.</div>
        ) : (
          <div className="space-y-8">
            {groups.today.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">Hôm nay</h2>
                <div className="space-y-3">
                  {groups.today.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => (!a.isRead ? markRead.mutate(a.id) : null)}
                      className="w-full text-left bg-white p-4 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors relative"
                    >
                      {!a.isRead && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full" />}
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{IconFor(a)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{a.title}</div>
                          <div className="text-sm text-gray-700 mt-1">{a.content}</div>
                          <div className="text-xs text-gray-500 mt-2">{format(new Date(a.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {groups.yesterday.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">Hôm qua</h2>
                <div className="space-y-3">
                  {groups.yesterday.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => (!a.isRead ? markRead.mutate(a.id) : null)}
                      className="w-full text-left bg-white p-4 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors relative"
                    >
                      {!a.isRead && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full" />}
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{IconFor(a)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{a.title}</div>
                          <div className="text-sm text-gray-700 mt-1">{a.content}</div>
                          <div className="text-xs text-gray-500 mt-2">{format(new Date(a.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {groups.older.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">Cũ hơn</h2>
                <div className="space-y-3">
                  {groups.older.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => (!a.isRead ? markRead.mutate(a.id) : null)}
                      className="w-full text-left bg-white p-4 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors relative"
                    >
                      {!a.isRead && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full" />}
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{IconFor(a)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{a.title}</div>
                          <div className="text-sm text-gray-700 mt-1">{a.content}</div>
                          <div className="text-xs text-gray-500 mt-2">{format(new Date(a.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
