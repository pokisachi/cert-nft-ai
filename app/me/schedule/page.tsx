"use client";
import { useEffect, useState } from "react";

type ScheduleRow = {
  course: string;
  teacher: string;
  room: string;
  dayOfWeek: string;
  timeSlot: string;
};

export default function MySchedulePage() {
  const [data, setData] = useState<ScheduleRow[]>([]);

  useEffect(() => {
    fetch("/api/me/schedule")
      .then((r) => r.json())
      .then((res) => setData(res.data || []));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">📅 Lịch học của tôi</h1>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Khóa học</th>
            <th className="p-2">Giáo viên</th>
            <th className="p-2">Phòng</th>
            <th className="p-2">Thứ</th>
            <th className="p-2">Ca học</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{d.course}</td>
              <td className="p-2">{d.teacher}</td>
              <td className="p-2">{d.room}</td>
              <td className="p-2">{d.dayOfWeek}</td>
              <td className="p-2">{d.timeSlot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
