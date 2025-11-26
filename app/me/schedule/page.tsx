"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type ScheduleRow = {
  course: string;
  teacher: string;
  room: string;
  dayOfWeek: string;
  timeSlot: string;
  startDate: string;
  endDate: string;
};

export default function MySchedulePage() {
  const [data, setData] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch("/api/me/schedule")
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.error || "FETCH_FAILED");
        return res;
      })
      .then((res) => setData(res.data || []))
      .catch((e: any) => setErr(e?.message || "Không thể tải lịch học"))
      .finally(() => setLoading(false));
  }, []);

  const dayMap: Record<string, string> = { Mon: "Thứ 2", Tue: "Thứ 3", Wed: "Thứ 4", Thu: "Thứ 5", Fri: "Thứ 6", Sat: "Thứ 7", Sun: "CN" };
  const timeMap: Record<string, string> = { EVENING_1: "17h45–19h15", EVENING_2: "19h30–21h00" };

  return (
    <main className="p-6 bg-[#111318] min-h-[calc(100vh-64px)] text-white">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lịch học của tôi</h1>
        </div>

        <Card variant="dark" className="border border-[#3b4354]">
          <CardHeader className="border-[#3b4354]">
            <CardTitle className="text-white">Chi tiết lịch học</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6 text-white/70">Đang tải...</div>
            ) : err ? (
              <div className="py-6 text-red-400">{err}</div>
            ) : (data.length === 0) ? (
              <div className="py-6 text-white/70">Chưa có lịch học.</div>
            ) : (
              <Table variant="dark">
                <TableHeader variant="dark">
                  <TableRow variant="dark">
                    <TableHead variant="dark">Khóa học</TableHead>
                    <TableHead variant="dark">Giáo viên</TableHead>
                    <TableHead variant="dark">Phòng</TableHead>
                    <TableHead variant="dark">Thứ</TableHead>
                    <TableHead variant="dark">Ca học</TableHead>
                    <TableHead variant="dark">Bắt đầu</TableHead>
                    <TableHead variant="dark">Kết thúc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-[#1c1f27]">
                  {data.map((d, i) => {
                    const start = d.startDate ? new Date(d.startDate).toLocaleDateString("vi-VN") : "";
                    const end = d.endDate ? new Date(d.endDate).toLocaleDateString("vi-VN") : "";
                    return (
                      <TableRow key={i} variant="dark">
                        <TableCell className="font-medium text-white">{d.course}</TableCell>
                        <TableCell className="text-white/80">{d.teacher}</TableCell>
                        <TableCell className="text-white/80">{d.room}</TableCell>
                        <TableCell className="text-white/80">{dayMap[d.dayOfWeek] || d.dayOfWeek}</TableCell>
                        <TableCell className="text-white/80">{timeMap[d.timeSlot] || d.timeSlot}</TableCell>
                        <TableCell className="text-white/80">{start}</TableCell>
                        <TableCell className="text-white/80">{end}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
