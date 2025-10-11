'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { CertificatesResponse } from './types';

export function useMyCertificates(limit = 10) {
  return useQuery({
    queryKey: ['me', 'certificates', { limit }],
    queryFn: () => apiFetch<CertificatesResponse>(`/api/me/certificates?limit=${limit}&offset=0`),
  });
}
