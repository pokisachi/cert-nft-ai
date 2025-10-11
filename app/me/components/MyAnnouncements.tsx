'use client';

import { useMyAnnouncements } from '../hooks/useMyAnnouncements';
import { fmtDate } from '@/lib/date';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnnouncementItem } from '../hooks/types';

export default function MyAnnouncements() {
  const { data, isLoading, isError, refetch, markRead } = useMyAnnouncements(5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{t('announcements')}</CardTitle>
        <Link href="/me/announcements" className="text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>
              <button
                onClick={() => refetch()}
                className="mt-2 underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Retry fetch announcements"
              >
                {t('retry')}
              </button>
            </AlertDescription>
          </Alert>
        ) : (data?.items?.length || 0) === 0 ? (
          <div className="py-4 text-sm text-gray-600">{t('empty_announcements')}</div>
        ) : (
          <ul className="divide-y">
            {data!.items.map((a: AnnouncementItem) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{a.title}</p>
                    {!a.isRead ? (
                      <Badge variant="default" className="text-[10px]" aria-label="new announcement">
                        {t('new')}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500">{fmtDate(a.createdAt, true)} • {a.scope}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!a.isRead ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead.mutate(a.id)}
                      aria-label={`Mark announcement ${a.id} as read`}
                    >
                      {t('markRead')}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
