
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, BookOpen, BadgeCheck, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

 

type DashboardStats = {
  learners: number;
  courses: number;
  exams: number;
  certificates: number;
  notifications?: number;
};

 

function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', color)}>{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-slate-600">{title}</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

 

 

type ActivityItem = {
  id: string;
  actor: 'ADMIN' | 'SYSTEM' | 'USER';
  name: string;
  action: 'CREATE_COURSE' | 'CREATE_EXAM' | 'ISSUE_CERTIFICATE' | 'USER_REGISTER';
  message: string;
  time: string | Date | null;
  status: 'New' | 'Success' | 'System';
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  const [studentSeries, setStudentSeries] = useState<Array<{ label: string; count: number }>>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [examSeries, setExamSeries] = useState<Array<{ label: string; count: number }>>([]);
  const [examLoading, setExamLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/admin/stats', { signal: ac.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const qs1 = new URLSearchParams({ page: '1', size: '20' });
        const qs2 = new URLSearchParams({ pageSize: '20', sortBy: 'issuedAt', sortDir: 'desc' });
        const qs3 = new URLSearchParams({ pageSize: '20', sort: 'enrolledAt:desc' });
        const [coursesRes, examsRes, certsRes, enrollRes] = await Promise.all([
          fetch(`/api/admin/courses?${qs1.toString()}`, { signal: ac.signal }),
          fetch(`/api/admin/exam-sessions`, { signal: ac.signal }),
          fetch(`/api/admin/certificates?${qs2.toString()}`, { signal: ac.signal }),
          fetch(`/api/admin/enrollments?${qs3.toString()}`, { signal: ac.signal }),
        ]);
        const coursesJson = await coursesRes.json().catch(() => ({}));
        const examsJson = await examsRes.json().catch(() => ({}));
        const certsJson = await certsRes.json().catch(() => ({}));
        const enrollJson = await enrollRes.json().catch(() => ({}));
        const courses = Array.isArray(coursesJson?.data) ? coursesJson.data : [];
        const exams = Array.isArray(examsJson) ? examsJson : Array.isArray(examsJson?.data) ? examsJson.data : [];
        const certs = Array.isArray(certsJson?.items) ? certsJson.items : [];
        const enrolls = Array.isArray(enrollJson?.data) ? enrollJson.data : [];

        const evts: ActivityItem[] = [];
        evts.push(
          ...courses.map((c: any) => ({
            id: `course-${c.id}`,
            actor: 'ADMIN',
            name: 'Admin',
            action: 'CREATE_COURSE',
            message: `Admin vừa tạo khóa học mới: ${c.title}`,
            time: c.createdAt,
            status: 'New',
          }))
        );
        evts.push(
          ...exams.map((s: any) => ({
            id: `exam-${s.id}`,
            actor: 'ADMIN',
            name: 'Admin',
            action: 'CREATE_EXAM',
            message: `Admin vừa tạo kỳ thi: ${s.course?.title || 'Kỳ thi'}`,
            time: s.date,
            status: 'New',
          }))
        );
        evts.push(
          ...certs.map((c: any) => ({
            id: `cert-${c.id}`,
            actor: 'SYSTEM',
            name: 'Hệ thống',
            action: 'ISSUE_CERTIFICATE',
            message: `Hệ thống đã cấp chứng chỉ cho ${c.user?.name || 'Học viên'}`,
            time: c.issuedAt,
            status: 'Success',
          }))
        );
        evts.push(
          ...enrolls.map((r: any) => ({
            id: `enroll-${r.enrollmentId}`,
            actor: 'USER',
            name: r.learner?.name || 'Người dùng',
            action: 'USER_REGISTER',
            message: `${r.learner?.name || 'Người dùng'} vừa đăng ký tài khoản`,
            time: r.createdAt,
            status: 'New',
          }))
        );

        evts.sort((a, b) => new Date(b.time || 0 as any).getTime() - new Date(a.time || 0 as any).getTime());
        setActivities(evts.slice(0, 10));
      } catch {
        setActivities([]);
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setStudentLoading(true);
    const p = new URLSearchParams({ page: '1', pageSize: '100', sort: 'enrolledAt:desc' });
    fetch(`/api/admin/enrollments?${p.toString()}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((json) => {
        const rows = Array.isArray(json?.data) ? json.data : [];
        const now = new Date();
        const labels = Array.from({ length: 7 }, (_v, i) => {
          const d = subDays(now, 6 - i);
          const key = format(d, 'yyyy-MM-dd');
          return { key, label: format(d, 'dd/MM') };
        });
        const map = new Map(labels.map(({ key }) => [key, 0] as [string, number]));
        rows.forEach((row: any) => {
          const dt = row?.createdAt ? new Date(row.createdAt) : null;
          if (!dt) return;
          const k = format(dt, 'yyyy-MM-dd');
          if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
        });
        setStudentSeries(labels.map(({ label, key }) => ({ label, count: map.get(key) || 0 })));
      })
      .catch(() => {
        const now = new Date();
        const series = Array.from({ length: 7 }, (_v, i) => {
          const d = subDays(now, 6 - i);
          return { label: format(d, 'dd/MM'), count: 0 };
        });
        setStudentSeries(series);
      })
      .finally(() => setStudentLoading(false));
    return () => ac.abort();
  }, []);

  

  useEffect(() => {
    const ac = new AbortController();
    setExamLoading(true);
    fetch(`/api/admin/exam-sessions`, { signal: ac.signal })
      .then((r) => r.json())
      .then((json) => {
        const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        const now = new Date();
        const labels = Array.from({ length: 7 }, (_v, i) => {
          const d = subDays(now, 6 - i);
          const key = format(d, 'yyyy-MM-dd');
          return { key, label: format(d, 'dd/MM') };
        });
        const map = new Map(labels.map(({ key }) => [key, 0] as [string, number]));
        rows.forEach((row: any) => {
          const dt = row?.date ? new Date(row.date) : null;
          if (!dt) return;
          const k = format(dt, 'yyyy-MM-dd');
          if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
        });
        setExamSeries(labels.map(({ label, key }) => ({ label, count: map.get(key) || 0 })));
      })
      .catch(() => {
        const now = new Date();
        const series = Array.from({ length: 7 }, (_v, i) => {
          const d = subDays(now, 6 - i);
          return { label: format(d, 'dd/MM'), count: 0 };
        });
        setExamSeries(series);
      })
      .finally(() => setExamLoading(false));
    return () => ac.abort();
  }, []);

  const summary = useMemo(() => {
    return stats || { learners: 0, courses: 0, exams: 0, certificates: 0, notifications: 0 };
  }, [stats]);

  const cards = useMemo(() => {
    return [
      { title: 'Tổng học viên', value: summary.learners, icon: <Users className="h-6 w-6 text-blue-600" />, color: 'bg-blue-50' },
      { title: 'NFT đã cấp', value: summary.certificates, icon: <BadgeCheck className="h-6 w-6 text-emerald-600" />, color: 'bg-emerald-50' },
      { title: 'Khóa học Active', value: summary.courses, icon: <BookOpen className="h-6 w-6 text-amber-600" />, color: 'bg-amber-50' },
    ];
  }, [summary]);

  const pieData = useMemo(() => {
    const issued = summary?.certificates ?? 0;
    const pending = 0;
    return [
      { name: 'Đã cấp', value: issued },
      { name: 'Đang chờ', value: pending },
    ];
  }, [summary]);

  

  

  if (!stats)
    return (
      <section className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-1 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[0,1,2,3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 mt-3" />
            </Card>
          ))}
        </div>
      </section>
    );

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold inline-flex items-center gap-2 text-slate-900"><Home className="h-5 w-5" />Bảng điều khiển</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full mt-3" />
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    {cards.map((c, i) => (
      <StatsCard key={i} title={c.title} value={c.value} icon={c.icon} color={c.color} />
    ))}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
      <div className="mb-4">
        <CardTitle className="text-slate-900">Thống kê lượng học viên đăng ký</CardTitle>
      </div>
      <div className="h-[420px]">
        {studentLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={studentSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="studentsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" stroke="#475569" tick={{ fill: '#475569' }} />
              <YAxis stroke="#475569" tick={{ fill: '#475569' }} allowDecimals={false} />
              <RTooltip cursor={{ stroke: 'rgba(59,130,246,0.2)' }} />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fill="url(#studentsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
    <Card className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <CardTitle className="text-slate-900">Tỷ lệ cấp chứng chỉ</CardTitle>
      </div>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={90} outerRadius={120}>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">Người dùng</th>
                    <th className="px-3 py-2">Hành động</th>
                    <th className="px-3 py-2">Thời gian</th>
                    <th className="px-3 py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} className="border-t border-slate-200">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            {a.actor === 'ADMIN' ? 'A' : a.actor === 'SYSTEM' ? 'S' : (a.name?.[0] || 'U')}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{a.name}</div>
                            <div className="text-xs text-slate-500">{a.actor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-900">{a.message}</div>
                        <div className="text-xs text-slate-500">{a.action}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true, locale: vi }) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {a.status === 'Success' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Success</Badge>
                        ) : a.status === 'System' ? (
                          <Badge className="bg-slate-100 text-slate-700 border border-slate-200">System</Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">New</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr className="border-t border-slate-200">
                      <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>Không có hoạt động gần đây</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <CardTitle className="text-slate-900">Kỳ thi được tổ chức</CardTitle>
          </div>
          <div className="h-[350px]">
            {examLoading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examSeries.map((d, i) => ({ ...d, color: i % 2 === 0 ? '#3B82F6' : '#60A5FA' }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" stroke="#475569" tick={{ fill: '#475569' }} />
                  <YAxis stroke="#475569" tick={{ fill: '#475569' }} allowDecimals={false} />
                  <RTooltip cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {examSeries.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#3B82F6' : '#60A5FA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
