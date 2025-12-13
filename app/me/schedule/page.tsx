"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { startOfWeek, addWeeks, addDays, isWithinInterval, format } from "date-fns";

type ScheduleRow = {
  course: string;
  teacher: string;
  room: string;
  dayOfWeek: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING_1" | "EVENING_2";
  startDate?: string;
  endDate?: string;
};

type ClassItem = ScheduleRow & {
  status: "upcoming" | "completed" | "live";
  color: "blue" | "green" | "purple" | "orange" | "pink" | "indigo" | "red" | "teal" | "cyan";
};

type ClassOccurrence = ClassItem & {
  occDate: Date;
};

const WEEK_DAYS: { label: string; value: ClassItem["dayOfWeek"] }[] = [
  { label: "Thứ 2", value: "Mon" },
  { label: "Thứ 3", value: "Tue" },
  { label: "Thứ 4", value: "Wed" },
  { label: "Thứ 5", value: "Thu" },
  { label: "Thứ 6", value: "Fri" },
  { label: "Thứ 7", value: "Sat" },
  { label: "Chủ nhật", value: "Sun" },
];

const TIME_SLOTS: Record<ScheduleRow["timeSlot"], { label: string; startMinutes: number }> = {
  MORNING: { label: "08:00–10:00", startMinutes: 480 },
  AFTERNOON: { label: "14:00–16:00", startMinutes: 840 },
  EVENING_1: { label: "17h45–19h15", startMinutes: 1065 },
  EVENING_2: { label: "19h30–21h00", startMinutes: 1170 },
};

const BORDER_CLASS: Record<ClassItem["color"], string> = {
  blue: "border-l-blue-500",
  green: "border-l-green-500",
  purple: "border-l-purple-500",
  orange: "border-l-orange-500",
  pink: "border-l-pink-500",
  indigo: "border-l-indigo-500",
  red: "border-l-red-500",
  teal: "border-l-teal-500",
  cyan: "border-l-cyan-500",
};

export default function MySchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: apiResp, isError: _isError } = useQuery<{ data: ScheduleRow[] }>({
    queryKey: ["me", "schedule"],
    queryFn: () => apiFetch<{ data: ScheduleRow[] }>("/api/me/schedule"),
  });

  const mondayOfWeek = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(mondayOfWeek);
      d.setDate(mondayOfWeek.getDate() + i);
      return d;
    });
  }, [mondayOfWeek]);

  

  const now = new Date();
  const colors: ClassItem["color"][] = ["blue", "green", "purple", "orange", "pink", "indigo", "red", "teal", "cyan"];
  const pickColor = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const dayToIndex: Record<ScheduleRow["dayOfWeek"], number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  const courseWindow = (r: ScheduleRow) => {
    const start = r.startDate ? new Date(r.startDate) : null;
    const end = r.endDate ? new Date(r.endDate) : null;
    return { start, end };
  };

  const buildOccurrences = (rows: ScheduleRow[]): ClassOccurrence[] => {
    return rows
      .map((r) => {
        const { start, end } = courseWindow(r);
        if (!start || !end) return null;
        const occ = addDays(mondayOfWeek, dayToIndex[r.dayOfWeek]);
        const within = isWithinInterval(occ, { start, end });
        if (!within) return null;
        const color = pickColor(r.course);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const occDay = new Date(occ.getFullYear(), occ.getMonth(), occ.getDate());
        let status: ClassItem["status"] = "upcoming";
        if (occDay < today) status = "completed";
        else if (occDay.getTime() === today.getTime()) {
          const startMin = TIME_SLOTS[r.timeSlot].startMinutes;
          const cur = now.getHours() * 60 + now.getMinutes();
          status = cur >= startMin && cur <= startMin + 90 ? "live" : "upcoming";
        }
        return { ...r, status, color, occDate: occ } as ClassOccurrence;
      })
      .filter(Boolean) as ClassOccurrence[];
  };

  const classesOfWeek = buildOccurrences((apiResp?.data || []));

  const nextClass = useMemo(() => {
    const ordered = classesOfWeek
      .filter((c) => c.status !== "completed")
      .sort((a, b) => {
        const da = a.occDate.getTime();
        const db = b.occDate.getTime();
        if (da !== db) return da - db;
        return TIME_SLOTS[a.timeSlot].startMinutes - TIME_SLOTS[b.timeSlot].startMinutes;
      });
    return ordered[0] || null;
  }, [classesOfWeek]);

  return (
    <main className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Lịch học của tôi</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((v) => v - 1)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 shadow-sm hover:bg-gray-50"
            >
              <span className="mr-1">⟨</span> Tuần trước
            </button>
            <button
              onClick={() => setWeekOffset((v) => v + 1)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Tuần sau <span className="ml-1">⟩</span>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-200"
            >
              Tuần này
            </button>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <p className="text-sm font-medium">🔔 Sắp diễn ra: {nextClass ? TIME_SLOTS[nextClass.timeSlot].label.split("–")[0] : ""} - {nextClass && format(nextClass.occDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "Hôm nay" : "Tuần này"}</p>
          <h3 className="text-xl font-bold mt-2">{nextClass ? nextClass.course : ""}</h3>
          <p className="mt-2">{nextClass ? nextClass.room : ""}</p>
          <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium">Vào lớp ngay</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 mt-6">
          {WEEK_DAYS.map((day, index) => {
            const date = weekDates[index];
            const label = `${day.label} - ${format(date, "dd/MM")}`;
            const items = classesOfWeek.filter((c) => c.dayOfWeek === day.value);
            return (
              <div key={day.value} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                <div className="font-medium text-gray-900">{label}</div>
                <div className="mt-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="h-16 rounded-lg border border-gray-100 bg-gray-50 border-dashed text-gray-400 flex items-center justify-center text-sm">Không có lớp</div>
                  ) : (
                    items.map((item, i) => {
                      const border = BORDER_CLASS[item.color];
                      const statusCls = item.status === "upcoming"
                        ? "bg-yellow-100 text-yellow-700"
                        : item.status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-green-100 text-green-700";
                      const statusLabel = item.status === "upcoming" ? "Sắp học" : item.status === "completed" ? "Đã học" : "Đang học";
                      return (
                        <div key={i} className={`bg-white shadow-sm p-3 rounded-lg border-l-4 ${border} border border-gray-200`}>
                          <div className="text-xs font-medium text-gray-500">{TIME_SLOTS[item.timeSlot].label}</div>
                          <div className="font-bold text-gray-900 mt-1 truncate">{item.course}</div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center"><MapPin className="h-3 w-3 mr-1" />{item.room}</div>
                          <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${statusCls}`}>{statusLabel}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
