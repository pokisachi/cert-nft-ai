'use client';

import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
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

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement, LineElement, Filler);

type DashboardStats = {
  learners: number;
  courses: number;
  exams: number;
  certificates: number;
};

type ChartData = Record<string, number>;
type TimeRange = 'day' | 'week' | 'month' | 'year';
type StatType = 'learners' | 'courses' | 'exams' | 'certificates';

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

  // Lấy dữ liệu tổng quan
  useEffect(() => {
    fetch('/api/admin/stats/full')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      });
  }, []);

  // Lấy dữ liệu cho từng biểu đồ
  useEffect(() => {
    const types: StatType[] = ['learners', 'courses', 'exams', 'certificates'];
    types.forEach((t) => {
      fetch(`/api/admin/stats/detail?type=${t}&range=${range[t]}`)
        .then((r) => r.json())
        .then((res) => {
          setCharts((prev) => ({ ...prev, [t]: res.data || {} }));
        });
    });
  }, [range]);

  if (!stats) return <div className="p-8 bg-[#111318] text-white/70">Đang tải dữ liệu...</div>;

  const cards = [
    { title: 'Học viên', value: stats.learners, color: 'from-blue-500 to-blue-600', icon: <Users className="h-4 w-4" /> },
    { title: 'Khóa học', value: stats.courses, color: 'from-yellow-500 to-yellow-600', icon: <BookOpen className="h-4 w-4" /> },
    { title: 'Kỳ thi', value: stats.exams, color: 'from-green-500 to-green-600', icon: <FileText className="h-4 w-4" /> },
    { title: 'Chứng chỉ', value: stats.certificates, color: 'from-red-500 to-red-600', icon: <BadgeCheck className="h-4 w-4" /> },
  ];

  const makeBarChart = (label: string, values: ChartData, color: string) => {
    const labels = Object.keys(values).sort();
    const dataset = labels.map((k) => values[k]);
    return {
      data: {
        labels,
        datasets: [
          {
            label,
            data: dataset,
            backgroundColor: '#2c3240',
            hoverBackgroundColor: '#3a4150',
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: '', font: { size: 16 } },
        },
        scales: {
          x: { grid: { color: 'rgba(59,67,84,0.3)' }, ticks: { color: '#9da6b9' } },
          y: { beginAtZero: true, min: 0, suggestedMin: 0, grid: { color: 'rgba(59,67,84,0.3)' }, ticks: { color: '#9da6b9' } },
        },
      },
    };
  };

  const makeLineChart = (label: string, values: ChartData, color: string) => {
    const labels = Object.keys(values).sort();
    const dataset = labels.map((k) => values[k]);
    const useLabels = [''].concat(labels);
    const useDataset = [0].concat(dataset);
    return {
      data: {
        labels: useLabels,
        datasets: [
          {
            label,
            data: useDataset,
            borderColor: color || '#9da6b9',
            backgroundColor: 'rgba(40,45,57,0.5)',
            fill: 'origin',
            tension: 0.4,
            pointRadius: 0,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(59,67,84,0.3)' }, ticks: { color: '#9da6b9' } },
          y: { beginAtZero: true, min: 0, suggestedMin: 0, grid: { color: 'rgba(59,67,84,0.3)' }, ticks: { color: '#9da6b9' } },
        },
      },
    };
  };

  const handleRangeChange = (type: StatType, newRange: TimeRange) => {
    setRange((prev) => ({ ...prev, [type]: newRange }));
  };

  return (
    <main className="p-8 space-y-10 bg-[#111318] text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 inline-flex items-center gap-2"><Home className="h-5 w-5" />Bảng điều khiển</h1>

      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="p-6 rounded-lg bg-[#282d39] border border-[#3b4354] text-white">
            <h2 className="text-sm inline-flex items-center gap-2">{c.icon}{c.title}</h2>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard
          title="Học viên đăng ký"
          color="rgba(59,130,246,0.7)"
          data={charts.learners}
          type="learners"
          range={range.learners}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
          makeLineChart={makeLineChart}
          icon={<Users className="h-4 w-4" />}
          variant="line"
        />
        <ChartCard
          title="Khóa học được tạo"
          color="rgba(234,179,8,0.7)"
          data={charts.courses}
          type="courses"
          range={range.courses}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
          makeLineChart={makeLineChart}
          icon={<BookOpen className="h-4 w-4" />}
          variant="bar"
        />
        <ChartCard
          title="Kỳ thi được mở"
          color="rgba(34,197,94,0.7)"
          data={charts.exams}
          type="exams"
          range={range.exams}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
          makeLineChart={makeLineChart}
          icon={<FileText className="h-4 w-4" />}
          variant="bar"
        />
        <ChartCard
          title="Chứng chỉ được cấp"
          color="rgba(239,68,68,0.7)"
          data={charts.certificates}
          type="certificates"
          range={range.certificates}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
          makeLineChart={makeLineChart}
          icon={<BadgeCheck className="h-4 w-4" />}
          variant="line"
        />
      </div>
    </main>
  );
}

function ChartCard({
  title,
  color,
  data,
  type,
  range,
  onRangeChange,
  makeBarChart,
  makeLineChart,
  icon,
  variant = 'bar',
}: {
  title: string;
  color: string;
  data: ChartData;
  type: StatType;
  range: TimeRange;
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
    <div className="bg-[#1c1f27] border border-[#3b4354] p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white inline-flex items-center gap-2">{icon}{title}</h3>
        <select
          value={range}
          onChange={(e) => onRangeChange(type, e.target.value as TimeRange)}
          className="border border-[#3b4354] bg-[#1c1f27] text-white text-sm rounded-md p-1.5 focus:ring focus:ring-indigo-500/40"
        >
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
        </select>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-2xl font-semibold">{total}</div>
        <div className={delta >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
          {delta >= 0 ? '+' : ''}{delta}%
        </div>
        <div className="text-white/60 text-sm">30 ngày gần đây</div>
      </div>
      <div className="h-64">
        {variant === 'line' ? <Line {...chart} /> : <Bar {...chart} />}
      </div>
    </div>
  );
}
