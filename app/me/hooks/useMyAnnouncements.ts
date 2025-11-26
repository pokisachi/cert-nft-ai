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
  unreadCount: number;
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
        const nextUnread = Math.max(
          0,
          prev.unreadCount - (prev.items.find((a) => a.id === id && !a.isRead) ? 1 : 0)
        );
        qc.setQueryData<AnnouncementsResponse>(key, {
          ...prev,
          items: prev.items.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
          unreadCount: nextUnread,
        });
        if (typeof window !== 'undefined')
          window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unreadCount: nextUnread } }));
      }
      return { prev, key };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
      if (typeof window !== 'undefined') window.alert('Không thể cập nhật trạng thái. Vui lòng thử lại!');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'announcements'] });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('notifications:updated'));
    },
  });

  const markAllRead = useMutation({
    mutationKey: ['announcement', 'mark-all-read'],
    mutationFn: () => apiFetch<{ count: number }>(`/api/me/announcements/read-all`, { method: 'PATCH' }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['me', 'announcements'] });
      const key = ['me', 'announcements', { limit }];
      const prev = qc.getQueryData<AnnouncementsResponse>(key);
      if (prev) {
        qc.setQueryData<AnnouncementsResponse>(key, {
          ...prev,
          items: prev.items.map((a) => ({ ...a, isRead: true })),
          unreadCount: 0,
        });
        if (typeof window !== 'undefined')
          window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unreadCount: 0 } }));
      }
      return { prev, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'announcements'] });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('notifications:updated'));
    },
  });

  return { ...list, markRead, markAllRead };
}
