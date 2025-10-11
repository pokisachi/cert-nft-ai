'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

export type AnnouncementItem = {
  id: number;
  title: string;
  content: string;
  scope: 'global' | 'course' | 'personal';
  courseId?: number | null;
  createdAt: string;
  isRead: boolean;
};

export type AnnouncementsResponse = {
  items: AnnouncementItem[];
  total: number;
};

export function useMyAnnouncements(limit = 5) {
  const qc = useQueryClient();

  const list = useQuery<AnnouncementsResponse>({
    queryKey: ['me', 'announcements', { limit }],
    queryFn: () => apiFetch<AnnouncementsResponse>(`/api/me/announcements?limit=${limit}&offset=0`),
    staleTime: 1000 * 60 * 5,
  });

  const markRead = useMutation({
    mutationKey: ['announcement', 'mark-read'],
    mutationFn: (id: number) =>
      apiFetch<{ id: number; isRead: boolean }>(`/api/me/announcements/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true }),
      }),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ['me', 'announcements'] });
      const key = ['me', 'announcements', { limit }];
      const prev = qc.getQueryData<AnnouncementsResponse>(key);
      if (prev) {
        qc.setQueryData<AnnouncementsResponse>(key, {
          ...prev,
          items: prev.items.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        });
      }
      return { prev, key };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
      if (typeof window !== 'undefined') window.alert('Không thể cập nhật trạng thái. Vui lòng thử lại!');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'announcements'] });
    },
  });

  return { ...list, markRead };
}
