 'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
const BarChart = dynamic(() => import('react-chartjs-2').then((m) => m.Bar), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse" />,
});
const LineChart = dynamic(() => import('react-chartjs-2').then((m) => m.Line), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse" />,
});
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Users, BookOpen, FileText, BadgeCheck, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement, LineElement, Filler);

const shadowPlugin = {
  id: 'shadowPlugin',
  beforeDatasetsDraw(chart: any, _args: any, opts: any) {
    const c = chart.ctx;
    c.save();
    c.shadowColor = (opts && opts.color) || 'rgba(157,166,185,0.35)';
    c.shadowBlur = (opts && opts.blur) || 12;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
  },
  afterDatasetsDraw(chart: any) {
    chart.ctx.restore();
  },
};

ChartJS.register(shadowPlugin as any);

type DashboardStats = {
  learners: number;
  courses: number;
  exams: number;
  certificates: number;
};

type ChartData = Record<string, number>;
type TimeRange = 'day' | 'week' | 'month' | 'year';
type StatType = 'learners' | 'courses' | 'exams' | 'certificates';

const ChartPanel = memo(function ChartPanel({
  title,
  color,
  data,
  range,
  type,
  onRangeChange,
  makeBarChart,
  makeLineChart,
  icon,
  variant = 'bar',
}: {
  title: string;
  color: string;
  data: ChartData;
  range: TimeRange;
  type: StatType;
  onRangeChange: (type: StatType, newRange: TimeRange) => void;
  makeBarChart: (label: string, values: ChartData, color: string) => any;
  makeLineChart: (label: string, values: ChartData, color: string) => any;
  icon?: React.ReactNode;
  variant?: 'bar' | 'line';
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const vals = Object.values(data);
  const delta = vals.length > 1 ? Math.round(((vals[vals.length - 1] - vals[0]) / Math.max(1, vals[0])) * 100) : 0;
  const chart = variant === 'line' ? makeLineChart(title, data, color) : makeBarChart(title, data, color);
  return (
    <Card className="p-0">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="inline-flex items-center gap-2 text-slate-900">{icon}{title}</CardTitle>
        <div role="tablist" aria-label="Khoảng thời gian" className="inline-flex rounded-md border border-slate-300 bg-white shadow-sm">
          {(['day','week','month','year'] as TimeRange[]).map((key) => (
            <Button
              key={key}
              role="tab"
              aria-selected={range === key}
              onClick={() => onRangeChange(type, key)}
              variant={range === key ? 'secondary' : 'outline'}
              size="sm"
              className={cn(range === key ? 'bg-slate-900 text-white hover:bg-slate-900/90' : 'text-slate-700 hover:bg-slate-100')}
            >
              {key === 'day' ? 'Ngày' : key === 'week' ? 'Tuần' : key === 'month' ? 'Tháng' : 'Năm'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-2xl font-semibold text-slate-900">{total}</div>
          <div className={delta >= 0 ? 'text-emerald-600 text-sm' : 'text-red-600 text-sm'}>
            {delta >= 0 ? '+' : ''}{delta}%
          </div>
          <div className="text-slate-500 text-sm">30 ngày gần đây</div>
        </div>
        <div className="h-64">
          {variant === 'line' ? <LineChart {...chart} /> : <BarChart {...chart} />}
        </div>
      </CardContent>
    </Card>
  );
})

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<Record<StatType, ChartData>>({
    learners: {},
    courses: {},
    exams: {},
    certificates: {},
  });
  const [range, setRange] = useState<Record<StatType, TimeRange>>({
    learners: 'day',
    courses: 'day',
    exams: 'day',
    certificates: 'day',
  });
  const [globalRange, setGlobalRange] = useState<TimeRange>('day');

  // Lấy dữ liệu tổng quan
  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/admin/stats/full', { signal: ac.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Lấy dữ liệu cho từng biểu đồ
  useEffect(() => {
    const ac = new AbortController();
    const entries = Object.entries(range) as [StatType, TimeRange][];
    Promise.all(
      entries.map(([t, r]) =>
        fetch(`/api/admin/stats/detail?type=${t}&range=${r}`, { signal: ac.signal })
          .then((resp) => resp.json())
          .catch(() => ({ data: {} }))
      )
    ).then((results) => {
      setCharts((prev) => {
        const next = { ...prev };
        entries.forEach(([t], idx) => {
          next[t] = results[idx]?.data || {};
        });
        return next;
      });
    });
    return () => ac.abort();
  }, [range]);

  const summary = useMemo(() => {
    const sums = {
      learners: Object.values(charts.learners).reduce((a, b) => a + b, 0),
      courses: Object.values(charts.courses).reduce((a, b) => a + b, 0),
      exams: Object.values(charts.exams).reduce((a, b) => a + b, 0),
      certificates: Object.values(charts.certificates).reduce((a, b) => a + b, 0),
    } as DashboardStats;
    const allZero = Object.values(sums).every((v) => v === 0);
    return !allZero && sums ? sums : (stats || { learners: 0, courses: 0, exams: 0, certificates: 0 });
  }, [charts, stats]);

  const cards = useMemo(() => {
    return [
      { title: 'Học viên', value: summary.learners, icon: <Users className="h-4 w-4" /> },
      { title: 'Khóa học', value: summary.courses, icon: <BookOpen className="h-4 w-4" /> },
      { title: 'Kỳ thi', value: summary.exams, icon: <FileText className="h-4 w-4" /> },
      { title: 'Chứng chỉ', value: summary.certificates, icon: <BadgeCheck className="h-4 w-4" /> },
    ];
  }, [summary]);

  const makeBarChart = useCallback((label: string, values: ChartData, color: string) => {
    const labels = Object.keys(values).sort();
    const dataset = labels.map((k) => values[k]);
    return {
      data: {
        labels,
        datasets: [
          {
            label,
            data: dataset,
            backgroundColor: color || 'rgba(99,102,241,0.6)',
            hoverBackgroundColor: color || 'rgba(99,102,241,0.8)',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 450, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          title: { display: true, text: '', font: { size: 16 } },
        },
        scales: {
          x: { grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { color: '#475569' } },
          y: { beginAtZero: true, min: 0, suggestedMin: 0, grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { color: '#475569' } },
        },
      },
    };
  }, []);

  const makeLineChart = useCallback((label: string, values: ChartData, color: string) => {
    const labels = Object.keys(values).sort();
    const dataset = labels.map((k) => values[k]);
    const useLabels = [''].concat(labels);
    const useDataset = [0].concat(dataset);

    const bg = (ctx: any) => {
      const chart = ctx.chart;
      const { ctx: c, chartArea } = chart;
      if (!chartArea) return 'rgba(99,102,241,0.12)';
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, 'rgba(99,102,241,0.18)');
      g.addColorStop(1, 'rgba(99,102,241,0.00)');
      return g;
    };
    return {
      data: {
        labels: useLabels,
        datasets: [
          {
            label,
            data: useDataset,
            borderColor: color || '#6366F1',
            backgroundColor: bg,
            borderWidth: 3,
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            fill: 'origin',
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            pointBorderWidth: 2,
            pointBorderColor: color || '#6366F1',
            pointBackgroundColor: '#ffffff',
            spanGaps: false,
            clip: false,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 450, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, title: { display: false }, shadowPlugin: { color: 'rgba(157,166,185,0.25)', blur: 8 } },
        scales: {
          x: { grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { color: '#475569' } },
          y: { beginAtZero: true, min: 0, suggestedMin: 0, grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { color: '#475569' } },
        },
      },
    };
  }, []);

  const handleRangeChange = useCallback((type: StatType, newRange: TimeRange) => {
    setRange((prev) => ({ ...prev, [type]: newRange }));
  }, []);

  const setAllRanges = useCallback((newRange: TimeRange) => {
    setGlobalRange(newRange);
    setRange({ learners: newRange, courses: newRange, exams: newRange, certificates: newRange });
  }, []);

  if (!stats)
    return (
      <main className="p-6 md:p-8 space-y-8 bg-[#F7F8FA] text-slate-800 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8 space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-1 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 mt-3" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
            {[0,1,2,3].map((i) => (
              <Card key={i} className="p-0">
                <CardContent className="p-0">
                  <Skeleton className="h-64 w-full rounded-b-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );

  return (
    <main className="p-6 md:p-8 space-y-8 bg-[#F7F8FA] text-slate-800 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold inline-flex items-center gap-2 text-slate-900"><Home className="h-5 w-5" />Bảng điều khiển</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full mt-3" />
          </div>
          <div role="tablist" aria-label="Khoảng thời gian toàn trang" className="inline-flex rounded-md border border-slate-300 bg-white shadow-sm">
            {(['day','week','month','year'] as TimeRange[]).map((key) => (
              <Button
                key={key}
                role="tab"
                aria-selected={globalRange === key}
                onClick={() => setAllRanges(key)}
                variant={globalRange === key ? 'secondary' : 'outline'}
                size="sm"
                className={cn(globalRange === key ? 'bg-slate-900 text-white hover:bg-slate-900/90' : 'text-slate-700 hover:bg-slate-100')}
              >
                {key === 'day' ? 'Ngày' : key === 'week' ? 'Tuần' : key === 'month' ? 'Tháng' : 'Năm'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.title} className="p-6">
              <div className="text-sm inline-flex items-center gap-2 text-slate-600">{c.icon}{c.title}</div>
              <div className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">{c.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <ChartPanel
          title="Học viên đăng ký"
            color="rgba(59,130,246,0.7)"
            data={charts.learners}
            range={range.learners}
            type="learners"
            onRangeChange={handleRangeChange}
            makeBarChart={makeBarChart}
            makeLineChart={makeLineChart}
            icon={<Users className="h-4 w-4" />}
            variant="line"
        />
        <ChartPanel
          title="Khóa học được tạo"
            color="rgba(234,179,8,0.7)"
            data={charts.courses}
            range={range.courses}
            type="courses"
            onRangeChange={handleRangeChange}
            makeBarChart={makeBarChart}
            makeLineChart={makeLineChart}
            icon={<BookOpen className="h-4 w-4" />}
            variant="line"
        />
        <ChartPanel
          title="Kỳ thi được mở"
            color="rgba(34,197,94,0.7)"
            data={charts.exams}
            range={range.exams}
            type="exams"
            onRangeChange={handleRangeChange}
            makeBarChart={makeBarChart}
            makeLineChart={makeLineChart}
            icon={<FileText className="h-4 w-4" />}
            variant="line"
        />
        <ChartPanel
          title="Chứng chỉ được cấp"
            color="rgba(239,68,68,0.7)"
            data={charts.certificates}
            range={range.certificates}
            type="certificates"
            onRangeChange={handleRangeChange}
            makeBarChart={makeBarChart}
            makeLineChart={makeLineChart}
            icon={<BadgeCheck className="h-4 w-4" />}
            variant="line"
        />
        </div>
      </div>
    </main>
  );
}

