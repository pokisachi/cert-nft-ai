'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import type { CertificatesResponse, CertificateItem as CertItem } from '../hooks/types';

const PAGE_SIZE = 12;

function CertificatesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const status = (params.get('status') || '') as '' | 'VALID' | 'REVOKED';
  const [q, setQ] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me', 'certificates', { page, status }],
    queryFn: async (): Promise<CertificatesResponse> => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL('/api/me/certificates', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      if (status) url.searchParams.set('status', status);
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

  const setStatusTab = (tab: 'all' | 'valid' | 'revoked') => {
    const s = tab === 'valid' ? 'VALID' : tab === 'revoked' ? 'REVOKED' : '';
    setParam({ status: s, page: '1' });
  };

  const items = data?.items || [];
  const filtered = q.trim() ? items.filter((it: CertItem) => (it.courseTitle || '').toLowerCase().includes(q.trim().toLowerCase())) : items;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách chứng chỉ của tôi</h1>
          <p className="mt-1 text-gray-500">Quản lý và tra cứu chứng chỉ đã cấp</p>
        </div>

        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên chứng chỉ..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusTab('all')}
              className={`px-3 py-2 rounded-lg border ${!status ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >Tất cả</button>
            <button
              onClick={() => setStatusTab('valid')}
              className={`px-3 py-2 rounded-lg border ${status === 'VALID' ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >VALID</button>
            <button
              onClick={() => setStatusTab('revoked')}
              className={`px-3 py-2 rounded-lg border ${status === 'REVOKED' ? 'bg-white shadow-sm border-gray-200 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >REVOKED</button>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cert" className="inline-flex">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Tìm bằng PDF</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div>Đã có lỗi xảy ra.</div>
            <Button variant="outline" className="mt-3 border-gray-300" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center text-center">
            <Search className="h-12 w-12 text-gray-300" />
            <div className="mt-3 text-gray-800 font-medium">Không tìm thấy chứng chỉ nào phù hợp</div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((it: CertItem) => (
                <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-900 min-w-0 truncate">{it.courseTitle}</h3>
                    <span className={`${(it.status || 'VALID') === 'VALID' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} rounded-full px-3 py-1 text-xs font-semibold border`}>{it.status || 'VALID'}</span>
                  </div>
                  <div className="mt-3 text-gray-600">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-sm">Token ID: <span className="font-mono">#{it.tokenId || '-'}</span></div>
                      <div className="text-sm mt-1">IPFS CID: <span className="font-mono">{it.ipfsCid || '-'}</span></div>
                      <div className="text-sm mt-1">Ngày cấp: {new Date(it.issuedAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/me/certificates/${it.id}`} className="inline-flex items-center text-blue-600 hover:underline">
                      <span>Xem chi tiết</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
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

export default function CertificatesListPage() {
  return (
    <Suspense fallback={<main className="p-6">Đang tải...</main>}>
      <CertificatesContent />
    </Suspense>
  );
}
