'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

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
    learners: 'month',
    courses: 'month',
    exams: 'month',
    certificates: 'month',
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

  if (!stats) return <div className="p-8 text-gray-500">Đang tải dữ liệu...</div>;

  const cards = [
    { title: '👨‍🎓 Học viên', value: stats.learners, color: 'from-blue-500 to-blue-600' },
    { title: '📚 Khóa học', value: stats.courses, color: 'from-yellow-500 to-yellow-600' },
    { title: '🧾 Kỳ thi', value: stats.exams, color: 'from-green-500 to-green-600' },
    { title: '🎓 Chứng chỉ', value: stats.certificates, color: 'from-red-500 to-red-600' },
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
            backgroundColor: color,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: label, font: { size: 16 } },
        },
        scales: {
          x: { ticks: { color: '#4b5563' } },
          y: { beginAtZero: true },
        },
      },
    };
  };

  const handleRangeChange = (type: StatType, newRange: TimeRange) => {
    setRange((prev) => ({ ...prev, [type]: newRange }));
  };

  return (
    <main className="p-8 space-y-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Admin Dashboard</h1>

      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl shadow-md bg-gradient-to-r ${c.color} text-white transition-transform hover:scale-[1.02]`}
          >
            <h2 className="text-sm opacity-80">{c.title}</h2>
            <p className="text-4xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Biểu đồ cột */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard
          title="👨‍🎓 Học viên đăng ký"
          color="rgba(59,130,246,0.7)"
          data={charts.learners}
          type="learners"
          range={range.learners}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
        />
        <ChartCard
          title="📚 Khóa học được tạo"
          color="rgba(234,179,8,0.7)"
          data={charts.courses}
          type="courses"
          range={range.courses}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
        />
        <ChartCard
          title="🧾 Kỳ thi được mở"
          color="rgba(34,197,94,0.7)"
          data={charts.exams}
          type="exams"
          range={range.exams}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
        />
        <ChartCard
          title="🎓 Chứng chỉ được cấp"
          color="rgba(239,68,68,0.7)"
          data={charts.certificates}
          type="certificates"
          range={range.certificates}
          onRangeChange={handleRangeChange}
          makeBarChart={makeBarChart}
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
}: {
  title: string;
  color: string;
  data: ChartData;
  type: StatType;
  range: TimeRange;
  onRangeChange: (type: StatType, newRange: TimeRange) => void;
  makeBarChart: (label: string, values: ChartData, color: string) => any;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <select
          value={range}
          onChange={(e) => onRangeChange(type, e.target.value as TimeRange)}
          className="border border-gray-300 text-sm rounded-md p-1.5 focus:ring focus:ring-blue-200"
        >
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
        </select>
      </div>
      <div className="h-64">
        <Bar {...makeBarChart(title, data, color)} />
      </div>
    </div>
  );
}
