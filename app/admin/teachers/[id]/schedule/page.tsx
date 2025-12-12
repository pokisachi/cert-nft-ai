import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function TeacherSchedulePage({ params }: { params: { id: string } }) {
  const teacherId = params.id;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true },
  });

  const classes = await prisma.scheduledClass.findMany({
    where: { teacherId: teacherId },
    include: {
      course: { select: { id: true, title: true } },
      room: true,
      scheduledEnrollments: {
        include: {
          enrollment: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
  });

  return (
    <main className="max-w-5xl mx-auto mt-8 space-y-6 bg-white text-slate-900 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Lịch đã xếp cho {teacher?.name || "Giảng viên"}
        </h1>
        <Link href="/admin/teachers">
          <span className="text-sm text-slate-600 hover:text-slate-900">Quay lại danh sách</span>
        </Link>
      </div>

      {classes.length === 0 ? (
        <Card className="p-4">
          <p className="text-slate-700">Chưa có lịch nào được xếp cho giảng viên này.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{cls.course?.title || "Khóa học"}</p>
                  <p className="text-sm text-slate-600">
                    {cls.dayOfWeek} • {cls.timeSlot} • Phòng {cls.roomId}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(cls.startDate).toLocaleDateString()} – {new Date(cls.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-700">Học viên</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {cls.scheduledEnrollments.map((se) => (
                    <span key={se.id} className="text-xs rounded px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200">
                      {(se.enrollment.user?.name || "—") + " (" + (se.enrollment.user?.email || "—") + ")"}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
