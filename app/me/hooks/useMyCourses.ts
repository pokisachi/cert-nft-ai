'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { CoursesResponse } from './types';

export function useMyCourses(limit = 5) {
  return useQuery({
    queryKey: ['me', 'courses', { limit }],
    queryFn: () => apiFetch<CoursesResponse>(`/api/me/courses?limit=${limit}&offset=0`),
  });
}
