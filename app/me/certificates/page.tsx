'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/Pagination';
import CertificateCard from '../components/CertificateItem';
import type { CertificatesResponse, CertificateItem as CertItem } from '../hooks/types';

const PAGE_SIZE = 12;

export default function CertificatesListPage() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const status = (params.get('status') || '') as '' | 'VALID' | 'REVOKED';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me', 'certificates', { page, status }],
    queryFn: async (): Promise<CertificatesResponse> => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL('/api/me/certificates', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      if (status) url.searchParams.set('status', status); // optional filter
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('fetch certificates failed');
      return res.json();
    },
     placeholderData: (prev) => prev,
  });

  const setParam = (kv: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    Object.entries(kv).forEach(([k, v]) => (v === null ? q.delete(k) : q.set(k, v)));
    router.push(`/me/certificates?${q.toString()}`);
  };

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Tất cả chứng chỉ</CardTitle>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setParam({ status: e.target.value || '', page: '1' })}
            aria-label="Lọc trạng thái chứng chỉ"
          >
            <option value="">Tất cả</option>
            <option value="VALID">VALID</option>
            <option value="REVOKED">REVOKED</option>
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Đã có lỗi xảy ra.</AlertTitle>
              <AlertDescription><Button variant="link" onClick={() => refetch()}>Thử lại</Button></AlertDescription>
            </Alert>
          ) : (data?.items.length || 0) === 0 ? (
            <p className="py-6 text-sm text-gray-600">Bạn sẽ thấy chứng chỉ sau khi đậu và được cấp.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.items.map((it: CertItem) => (
                  <CertificateCard key={it.id} item={it} />
                ))}
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
