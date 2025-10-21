import { NextRequest } from 'next/server';

export function parsePagination(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') || 20)));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function parseSort(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get('sort') || 'enrolledAt:desc';
  const [field, dir] = sort.split(':');
  const valid = ['enrolledAt', 'status', 'preferredTime'];
  return {
    field: valid.includes(field) ? field : 'enrolledAt',
    direction: dir?.toLowerCase() === 'asc' ? 'asc' : 'desc',
  };
}

export function parseCSV(value?: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}
