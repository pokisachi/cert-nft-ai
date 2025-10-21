'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

// Kiểu dữ liệu trả về từ API
type Row = {
  enrollmentId: number;
  learner: { id: number; name: string | null; email: string };
  course: { id: number; title: string };
  preferredDays: string[];
  preferredTime: string | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  createdAt: string;
};

type ApiResp = { data: Row[]; meta: { page: number; pageSize: number; total: number } };

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'] as const;
const TIME_MAP: Record<string, string> = {
  EVENING_1: "17h45–19h15",
  EVENING_2: "19h30–21h00",
  MORNING: "07h30–09h00",
  AFTERNOON: "14h00–15h30",
};


export default function CourseEnrollmentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const [courseTitle, setCourseTitle] = useState<string>(''); // 🆕 Tên khóa học
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 🧩 Fetch tên khóa học từ API
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/courses/${id}`);
        if (!res.ok) throw new Error('Không thể tải thông tin khóa học');
        const data = await res.json();
        setCourseTitle(data.title || `Khóa #${id}`);
      } catch {
        setCourseTitle(`Khóa #${id}`);
      }
    })();
  }, [id]);

  const q = sp.get('q') || '';
  const preferredDays = sp.get('preferredDays') || '';
  const status = (sp.get('status') || '') as Row['status'] | '';
  const page = Math.max(1, Number(sp.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') || 20)));
  const sort = sp.get('sort') || 'enrolledAt:desc';

  // URL API
  const apiUrl = useMemo(() => {
    if (!id) return '';
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (preferredDays) p.set('preferredDays', preferredDays);
    if (status) p.set('status', status);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    p.set('sort', sort);
    return `/api/admin/courses/${id}/enrollments?${p.toString()}`;
  }, [id, q, preferredDays, status, page, pageSize, sort]);

  // Fetch danh sách ghi danh
  useEffect(() => {
    if (!id || !apiUrl) return;
    let mounted = true;
    setLoading(true);
    setErr(null);
    fetch(apiUrl)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => mounted && setResp(data))
      .catch((e) => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [apiUrl, id]);

  // Cập nhật query
  const updateQuery = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') p.delete(k);
      else p.set(k, String(v));
    });
    router.push(`/admin/courses/${id}/enrollments?${p.toString()}`);
  };

  // Toggle chọn thứ
  const toggleDay = (day: string) => {
    const arr = preferredDays ? preferredDays.split(',').filter(Boolean) : [];
    const exists = arr.includes(day);
    const next = exists ? arr.filter((d) => d !== day) : [...arr, day];
    updateQuery({ preferredDays: next.join(',') || undefined, page: 1 });
  };

  // Cập nhật trạng thái enrollment
  const onPatchStatus = async (enrollmentId: number, newStatus: Row['status']) => {
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const fresh = await fetch(apiUrl).then((r) => r.json());
      setResp(fresh);
    } catch (e: any) {
      alert(`Cập nhật thất bại: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* 🧾 Tiêu đề hiển thị tên khóa học */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Ghi danh khóa học:{" "}
          <span className="text-indigo-700">
            {courseTitle || `#${id}`}
          </span>
        </h1>
      </div>

      {/* Bộ lọc */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Tìm kiếm (tên/email)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Nhập tên hoặc email, Enter để tìm..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateQuery({ q: (e.target as HTMLInputElement).value, page: 1 });
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Trạng thái</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value || undefined, page: 1 })}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Số dòng / trang</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={String(pageSize)}
            onChange={(e) => updateQuery({ pageSize: Number(e.target.value), page: 1 })}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Sắp xếp</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={sort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
          >
            <option value="enrolledAt:desc">Ngày ghi danh ↓</option>
            <option value="enrolledAt:asc">Ngày ghi danh ↑</option>
            <option value="status:asc">Trạng thái ↑</option>
            <option value="status:desc">Trạng thái ↓</option>
          </select>
        </div>
      </div>

      {/* Thứ học */}
      <div>
        <div className="text-sm font-medium mb-1">Thứ học</div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = preferredDays.split(',').includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={`px-3 py-1 rounded border ${active ? 'bg-gray-200' : ''}`}
              >
                {d}
              </button>
            );
          })}
          <button
            onClick={() => updateQuery({ preferredDays: undefined, page: 1 })}
            className="px-3 py-1 rounded border"
          >
            Xoá lọc
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Họ tên</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Khóa học</th>
              <th className="text-left p-3">Thứ học</th>
              <th className="text-left p-3">Giờ học</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Ngày ghi danh</th>
              <th className="text-left p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3" colSpan={8}>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && err && (
              <tr>
                <td className="p-3 text-red-600" colSpan={8}>
                  Lỗi: {err}
                </td>
              </tr>
            )}
            {!loading && !err && resp?.data?.length === 0 && (
              <tr>
                <td className="p-3" colSpan={8}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {!loading &&
              !err &&
              resp?.data?.map((r) => (
                <tr key={r.enrollmentId} className="border-t">
                  <td className="p-3">{r.learner.name ?? '—'}</td>
                  <td className="p-3">{r.learner.email}</td>
                  <td className="p-3">{r.course.title}</td>
                  <td className="p-3">{r.preferredDays.join(', ')}</td>
                  <td className="p-3">
                    {r.preferredTime
                      ? TIME_MAP[r.preferredTime as keyof typeof TIME_MAP] || "—"
                      : "—"}
                  </td>


                  <td className="p-3">
                    <span className="px-2 py-1 border rounded">{r.status}</span>
                  </td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.status !== 'PENDING' && (
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() => onPatchStatus(r.enrollmentId, 'PENDING')}
                        >
                          Set PENDING
                        </button>
                      )}
                      {r.status !== 'ACTIVE' && (
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() => onPatchStatus(r.enrollmentId, 'ACTIVE')}
                        >
                          Set ACTIVE
                        </button>
                      )}
                      {r.status !== 'COMPLETED' && (
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() => onPatchStatus(r.enrollmentId, 'COMPLETED')}
                        >
                          Set COMPLETED
                        </button>
                      )}
                      {r.status !== 'CANCELED' && (
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() => onPatchStatus(r.enrollmentId, 'CANCELED')}
                        >
                          Set CANCELED
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between">
        <div>Tổng: {resp?.meta.total ?? 0}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => updateQuery({ page: page - 1 })}
          >
            Trước
          </button>
          <span>Trang {page}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={resp ? page * pageSize >= resp.meta.total : true}
            onClick={() => updateQuery({ page: page + 1 })}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
