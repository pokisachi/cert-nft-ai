import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowLeft } from "lucide-react";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABEL: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
const SLOT_TIME: Record<string, string> = {
  MORNING: "07:30–09:00",
  AFTERNOON: "14:00–15:30",
  EVENING_1: "17:45–19:15",
  EVENING_2: "19:30–21:00",
};

type ScheduleItem = {
  dayOfWeek: string;
  timeSlot: string;
  courseTitle: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
};

async function getTeacherSchedule(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { qualifications: { include: { qualification: true } } },
  });
  const classes = await prisma.scheduledClass.findMany({
    where: { teacherId },
    include: { course: { select: { id: true, title: true } }, room: true },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
  });
  const schedule: ScheduleItem[] = classes.map((cls) => ({
    dayOfWeek: cls.dayOfWeek,
    timeSlot: cls.timeSlot,
    courseTitle: cls.course?.title || "Khóa học",
    roomId: cls.roomId,
    startDate: cls.startDate,
    endDate: cls.endDate,
  }));
  return { teacher, schedule };
}

export default async function TeacherSchedulePage({ params }: { params: { id: string } }) {
  const teacherId = params.id;
  const { teacher, schedule } = await getTeacherSchedule(teacherId);

  const initial = String(teacher?.name || "GV").trim().charAt(0).toUpperCase();
  const qualifications = (teacher?.qualifications || []).map((q) => q.qualification.name);
  const scheduleData = schedule;
  const byDay: Record<string, any[]> = {};
  for (const d of DAYS_ORDER) byDay[d] = [];
  for (const item of scheduleData) {
    const day = item.dayOfWeek;
    if (byDay[day]) byDay[day].push(item);
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full max-w-[1920px] mx-auto p-6 space-y-6">
        <Card className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl">
              {initial || "G"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{teacher?.name || "Giảng viên"}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {qualifications.length > 0 ? (
                  qualifications.map((q) => (
                    <span key={q} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md">
                      {q}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Chưa có chuyên môn</span>
                )}
              </div>
            </div>
          </div>
          <Link href="/admin/teachers">
            <Button variant="outline" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </Button>
          </Link>
        </Card>

        {scheduleData.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <CalendarDays className="w-16 h-16 text-gray-300" />
            <p className="mt-4 text-lg font-semibold text-gray-800">
              Giảng viên này chưa có lịch giảng dạy nào trong tuần này
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-4">
              {DAYS_ORDER.map((d) => (
                <div key={`hdr-${d}`} className="text-center font-semibold text-gray-800 bg-gray-100 rounded-lg py-2">
                  {DAY_LABEL[d]}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {DAYS_ORDER.map((d) => {
                const items = byDay[d];
                return (
                  <div key={d} className="min-h-[500px] bg-white border-r border-gray-200 rounded-lg p-3">
                    {(!items || items.length === 0) ? (
                      <div className="text-sm text-gray-400 italic">Trống</div>
                    ) : (
                      items.map((it: ScheduleItem, idx: number) => {
                        const start = new Date(it.startDate);
                        const end = new Date(it.endDate);
                        const status =
                          now < start ? "upcoming" : now > end ? "done" : "ongoing";
                        const style =
                          status === "upcoming"
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : status === "ongoing"
                            ? "bg-green-50 border-l-4 border-green-500"
                            : "bg-gray-50 border-l-4 border-gray-300";
                        const timeLabel = SLOT_TIME[it.timeSlot] || it.timeSlot;
                        return (
                          <div key={`${d}-${idx}`} className={`${style} p-3 rounded shadow-sm mb-3`}>
                            <div className="text-sm font-semibold">{timeLabel}</div>
                            <div className="mt-1 text-sm text-gray-700">{it.courseTitle}</div>
                            <div className="text-sm text-gray-700">Phòng: {it.roomId}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
