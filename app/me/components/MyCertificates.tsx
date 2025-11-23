'use client';

import { useMyCertificates } from '../hooks/useMyCertificates';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CertificateCard from './CertificateItem';
import { CertificateItem } from '../hooks/types';

export default function MyCertificates() {
  const { data, isLoading, isError, refetch } = useMyCertificates(10);

  return (
    <Card variant="dark" className="border border-[#3b4354]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#3b4354]">
        <CardTitle className="text-base font-semibold text-white">{t('myCertificates')}</CardTitle>
        <Link href="/me/certificates" className="text-sm underline text-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-72 shrink-0" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>
              <button
                onClick={() => refetch()}
                className="mt-2 underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Retry fetch certificates"
              >
                {t('retry')}
              </button>
            </AlertDescription>
          </Alert>
        ) : (data?.items?.length || 0) === 0 ? (
          <div className="py-4 text-sm text-white/70">{t('empty_certificates')}</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data!.items.map((it: CertificateItem) => (
              <CertificateCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
