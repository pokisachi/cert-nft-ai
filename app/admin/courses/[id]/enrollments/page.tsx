'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CalendarDays } from 'lucide-react';

// ============================
// Kiểu dữ liệu
// ============================
type Row = {
  enrollmentId: number;
  learner: { id: number; name: string | null; email: string; walletAddress: string };
  course: { id: number; title: string };
  availableSlots: string[];
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  createdAt: string;
};
type ApiResp = { data: Row[]; meta: { page: number; pageSize: number; total: number } };

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS: Record<string, string> = {
  Mon: 'Thứ 2',
  Tue: 'Thứ 3',
  Wed: 'Thứ 4',
  Thu: 'Thứ 5',
  Fri: 'Thứ 6',
  Sat: 'Thứ 7',
  Sun: 'Chủ nhật',
};
const TIME_LABELS: Record<string, string> = {
  MORNING: '07h30–09h00 (Sáng)',
  AFTERNOON: '14h00–15h30 (Chiều)',
  EVENING_1: '17h45–19h15 (Tối 1)',
  EVENING_2: '19h30–21h00 (Tối 2)',
  CA_1: 'Ca 1',
  CA_2: 'Ca 2',
};

function displayTimeLabel(raw: string | undefined): string {
  if (!raw) return '—';
  const t = raw.trim().toUpperCase().replace(/[-\s]+/g, '_');
  // chuẩn hóa các biến thể phổ biến
  const aliases: Record<string, string> = {
    EVENING1: 'EVENING_1',
    EVENING2: 'EVENING_2',
    CA1: 'CA_1',
    CA2: 'CA_2',
  };
  const key = aliases[t] || t;
  return TIME_LABELS[key] || '—';
}

// ============================
// Hiển thị slot chọn
// ============================
function SlotList({ slots }: { slots: string[] }) {
  if (!slots?.length) return <>—</>;

  const sorted = [...slots].sort((a, b) => {
    const [dayA] = a.split('_');
    const [dayB] = b.split('_');
    return DAY_ORDER.indexOf(dayA) - DAY_ORDER.indexOf(dayB);
  });

  const parseSlotLabel = (slot: string) => {
    const parts = slot.split('_');
    const day = parts[0];
    const time = parts.slice(1).join('_');
    const dayLabel = DAY_LABELS[day] || day || '—';
    const timeLabel = displayTimeLabel(time);
    if (timeLabel !== '—' && timeLabel.includes('(')) {
      return `${dayLabel} ${timeLabel}`;
    }
    return `${dayLabel} (${timeLabel})`;
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {sorted.map((slot) => (
          <span key={slot} className="px-2 py-1 text-xs border rounded bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap">
            {parseSlotLabel(slot)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================
// Hiển thị học viên trong lớp
// ============================
function StudentList({ students }: { students: any[] }) {
  if (!students?.length) return <>Chưa có học viên</>;

  const sorted = [...students].sort((a, b) =>
    (a.learner?.name || '').localeCompare(b.learner?.name || '')
  );

  return (
    <div className="space-y-0.5">
      {sorted.map((enr: any, i: number) => (
        <div key={i} className="text-sm">
          {enr.learner?.name || '—'} <span className="text-slate-600">({enr.learner?.email || '—'})</span>
        </div>
      ))}
      <div className="text-xs text-slate-600 mt-1">Tổng: {students.length} HV</div>
    </div>
  );
}

// ============================
// Trang chính
// ============================
export default function CourseEnrollmentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const [courseTitle, setCourseTitle] = useState<string>('');
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [runMeta, setRunMeta] = useState<{ totalClasses: number; totalEnrollments: number; generatedAt: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmRunOpen, setConfirmRunOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [notice, setNotice] = useState<any>(null);

  // 🔹 Lấy tên khóa học
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/courses/${id}`);
        const data = await res.json();
        setCourseTitle(data.title || `Khóa #${id}`);
      } catch {
        setCourseTitle(`Khóa #${id}`);
      }
    })();
  }, [id]);

  // 🔹 Query danh sách ghi danh
  const q = sp.get('q') || '';
  const status = (sp.get('status') || '') as Row['status'] | '';
  const page = Math.max(1, Number(sp.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') || 20)));
  const sort = sp.get('sort') || 'enrolledAt:desc';

  const apiUrl = useMemo(() => {
    if (!id) return '';
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    p.set('sort', sort);
    return `/api/admin/courses/${id}/enrollments?${p.toString()}`;
  }, [id, q, status, page, pageSize, sort]);

  useEffect(() => {
    if (!id || !apiUrl) return;
    let mounted = true;
    setLoading(true);
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => mounted && setResp(data))
      .catch(() => mounted && setErr('Không thể tải danh sách'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [apiUrl, id]);

 // 🧠 Gọi AI Scheduler - ✅ FIXED
const handleRunScheduler = async () => {
  if (!id) return;
  
  setLoading(true);
  
  try {
    const res = await fetch('/api/admin/scheduler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: Number(id), dry: true }),
    });
    
    const result = await res.json();

    if (!res.ok) {
      setSchedulePreview(null);
      setRunMeta(null);
      setPreviewOpen(false);
      setNotice({ ...result, status: res.status });
      if (res.status === 409) {
        toast.warning(result.error || 'Một số học viên đã có lịch trong khoá này');
      } else if (res.status === 400) {
        toast.warning(result.error || 'Không thể chạy xếp lịch');
      } else {
        toast.error(result.error || 'Lỗi khi gọi AI Scheduler');
      }
      return;
    }

    // ✅ DEBUG: Log để kiểm tra
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 API Response:', result);
    console.log('   success:', result.success);
    console.log('   message:', result.message);
    console.log('   data:', result.data);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.success) {
      // ✅ FIXED: Chỉ lưu result.data vào state
      setSchedulePreview(result.data);
      setRunMeta(result.meta ?? null);
      const assignedCount = Array.isArray(result.data?.scheduledClasses) ? result.data.scheduledClasses.length : 0;
      toast.info(`Đã xếp ${assignedCount} lớp cho giảng viên và phòng cụ thể. Vui lòng kiểm tra và xác nhận.`);
      toast.success(result.message || 'Đã tạo lịch học thành công');
      setPreviewOpen(true);

      console.log('✅ Đã lưu vào state:');
      console.log('   Classes:', result.data.scheduledClasses?.length);
      console.log('   Enrollments:', result.data.scheduledEnrollments?.length);
    } else {
      setNotice({ error: result.error || 'Lỗi khi tạo lịch', status: 500 });
      toast.error(result.error || 'Lỗi khi tạo lịch');
      console.error('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
    toast.error('Lỗi khi gọi API scheduler');
  } finally {
    setLoading(false);
  }
};


  // 💾 Xác nhận lưu
  const handleConfirmSchedule = async () => {
    if (!schedulePreview) return;
    setSaving(true);
    const res = await fetch('/api/admin/scheduler/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: Number(id), schedule: schedulePreview }),
    });
    const data = await res.json();
    setSaving(false);
    toast.success(data.message || 'Đã lưu lịch thành công!');
  };

  const enrollmentLookup = useMemo(() => {
    const map = new Map<number, any>();
    resp?.data?.forEach((row) => map.set(row.enrollmentId, row));

    const previewCollections = [
      schedulePreview?.enrollments,
      schedulePreview?.students,
      schedulePreview?.enrollmentDetails,
    ];
    previewCollections.forEach((collection: any) => {
      if (!Array.isArray(collection)) return;
      collection.forEach((item: any) => {
        if (!item) return;
        const key = item.enrollmentId ?? item.id;
        if (key == null) return;
        map.set(key, item);
      });
    });

    return map;
  }, [resp, schedulePreview]);

  const groupedSchedules = useMemo(() => {
    if (!schedulePreview?.scheduledClasses?.length) return [];

    const studentsByClass = new Map<number, number[]>();
    (schedulePreview.scheduledEnrollments ?? []).forEach((enr: any) => {
      if (!enr) return;
      const classId = enr.scheduledClassId;
      const enrollmentId = enr.enrollmentId;
      if (classId == null || enrollmentId == null) return;
      const list = studentsByClass.get(classId) ?? [];
      list.push(enrollmentId);
      studentsByClass.set(classId, list);
    });

    const groups = new Map<string, any>();

    schedulePreview.scheduledClasses.forEach((cls: any, index: number) => {
      if (!cls) return;
      const classId = cls.id ?? cls.scheduledClassId ?? index + 1;
      const studentIds = studentsByClass.get(classId) ?? [];
      const uniqueStudentIds = Array.from(new Set(studentIds));
      if (!uniqueStudentIds.length) return;
      const sortedStudentIds = [...uniqueStudentIds].sort((a, b) => a - b);

      const teacherKey = cls.teacherId ?? cls.teacherName ?? '';
      const roomKey = cls.roomId ?? '';
      const scheduleKey = [
        teacherKey,
        roomKey,
        sortedStudentIds.join('-'),
        cls.startDate ?? '',
        cls.endDate ?? '',
      ].join('|');
      const slotKey = `${cls.dayOfWeek}_${cls.timeSlot}`;

      const students = sortedStudentIds.map((enrollmentId) => {
        const detail = enrollmentLookup.get(enrollmentId);
        if (detail?.learner) return detail;
        if (detail?.student) return { ...detail, learner: detail.student };
        return {
          enrollmentId,
          learner: {
            name: detail?.name ?? detail?.learnerName ?? `HV #${enrollmentId}`,
            email: detail?.email ?? detail?.learnerEmail ?? '',
          },
        };
      });

      const existing = groups.get(scheduleKey);
      if (existing) {
        if (!existing.slotSet.has(slotKey)) {
          existing.slots.push({ dayOfWeek: cls.dayOfWeek, timeSlot: cls.timeSlot });
          existing.slotSet.add(slotKey);
        }
      } else {
        groups.set(scheduleKey, {
          teacherId: cls.teacherId,
          teacherName: cls.teacherName,
          roomId: cls.roomId,
          startDate: cls.startDate,
          endDate: cls.endDate,
          slots: [{ dayOfWeek: cls.dayOfWeek, timeSlot: cls.timeSlot }],
          slotSet: new Set<string>([slotKey]),
          students,
        });
      }
    });

    const result = Array.from(groups.values()).map((group) => {
      const slots = [...group.slots].sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek ?? '') - DAY_ORDER.indexOf(b.dayOfWeek ?? '');
        if (dayDiff !== 0) return dayDiff;
        return (a.timeSlot || '').localeCompare(b.timeSlot || '');
      });
      return {
        teacherId: group.teacherId,
        teacherName: group.teacherName,
        roomId: group.roomId,
        startDate: group.startDate,
        endDate: group.endDate,
        slots,
        students: group.students,
      };
    });

    return result.sort((a, b) => {
      const teacherDiff = (a.teacherName || a.teacherId || '').localeCompare(b.teacherName || b.teacherId || '');
      if (teacherDiff !== 0) return teacherDiff;
      const roomDiff = (a.roomId || '').localeCompare(b.roomId || '');
      if (roomDiff !== 0) return roomDiff;
      const firstSlotA = a.slots[0];
      const firstSlotB = b.slots[0];
      const dayDiff = DAY_ORDER.indexOf(firstSlotA?.dayOfWeek ?? '') - DAY_ORDER.indexOf(firstSlotB?.dayOfWeek ?? '');
      if (dayDiff !== 0) return dayDiff;
      return (firstSlotA?.timeSlot || '').localeCompare(firstSlotB?.timeSlot || '');
    });
  }, [schedulePreview, enrollmentLookup]);

  // ============================
  // JSX render
  // ============================
  return (
    <div className="p-6 space-y-6 bg-white text-slate-900">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Ghi danh khóa học: <span className="text-slate-900">{courseTitle}</span>
        </h1>
        <div className="flex gap-3">
          <button onClick={() => setConfirmRunOpen(true)} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Tạo lịch tự động
          </button>
        </div>
      </div>

      {notice && (
        <Alert className="border border-amber-200 bg-amber-50 text-amber-900">
          <AlertTitle>{notice.error || 'Thông báo'}</AlertTitle>
          <AlertDescription>
            {notice.hint && (
              <div className="mt-1 text-sm">{notice.hint}</div>
            )}
            {Array.isArray(notice.learners) && notice.learners.length > 0 && (
              <div className="mt-2">
                <div className="text-sm">Danh sách học viên đã có lịch ({notice.count ?? notice.learners.length}):</div>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {notice.learners.slice(0, 10).map((it: any, idx: number) => (
                    <li key={idx}>{(it.learner?.name || '—')} {(it.learner?.email ? `(${it.learner.email})` : '')}</li>
                  ))}
                </ul>
                {notice.learners.length > 10 && (
                  <div className="text-xs text-slate-600">… và {notice.learners.length - 10} học viên khác</div>
                )}
              </div>
            )}
            <div className="mt-3">
              <button onClick={() => setNotice(null)} className="px-3 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Ẩn thông báo</button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog open={confirmRunOpen} onOpenChange={setConfirmRunOpen}>
        <AlertDialogContent variant="light" className="max-w-md w-[92vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Chạy AI Scheduler</AlertDialogTitle>
            <AlertDialogDescription>Khóa "{courseTitle}". Tiếp tục chạy?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-100">Hủy</AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={() => {
                  setConfirmRunOpen(false);
                  handleRunScheduler();
                }}
                disabled={loading}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Chạy
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <AlertDialogContent variant="light" className="max-w-5xl w-[96vw] max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300">Kết quả AI Scheduler</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Kết quả chạy AI Scheduler cho khoá học. Hệ thống hiển thị giảng viên và phòng đã được xếp. Vui lòng kiểm tra và xác nhận để lưu.
          </AlertDialogDescription>
          {runMeta && (
            <div className="mt-1 mb-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">{runMeta.totalClasses} lớp</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">{runMeta.totalEnrollments} ghi danh</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">{new Date(runMeta.generatedAt).toLocaleString()}</span>
            </div>
          )}
          {groupedSchedules.length > 0 && (
            <Alert className="mb-4">
              <AlertTitle>Đã xếp lịch</AlertTitle>
              <AlertDescription>
                {groupedSchedules.map((g: any, i: number) => (
                  <span key={i} className="text-sm block">
                    {(g.teacherName || g.teacherId || '—').toString()} — Phòng {g.roomId}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          )}
          
          {!schedulePreview?.scheduledClasses?.length && schedulePreview?.diagnostics && (
            <div className="mb-4 text-sm text-white/80">
              <div className="font-semibold mb-1">Chưa có đề xuất lịch hợp lệ.</div>
              <div className="text-white/70">Chẩn đoán nhanh:</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="rounded border border-[#3b4354] bg-[#12151b] p-2">Unassigned: {schedulePreview.diagnostics.unassigned ?? 0}</div>
                <div className="rounded border border-[#3b4354] bg-[#12151b] p-2">Gamma H1: {schedulePreview.diagnostics.gamma?.H1 ?? 0}</div>
                <div className="rounded border border-[#3b4354] bg-[#12151b] p-2">Gamma H2: {schedulePreview.diagnostics.gamma?.H2 ?? 0}</div>
                <div className="rounded border border-[#3b4354] bg-[#12151b] p-2">Gamma H3: {schedulePreview.diagnostics.gamma?.H3 ?? 0}</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
              {groupedSchedules.length > 0 ? (
                groupedSchedules.map((group: any, idx: number) => (
                  <div key={idx} className="h-full rounded-xl border border-slate-200 bg-white p-4 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 ring-1 ring-indigo-200 flex items-center justify-center text-indigo-700">
                          {(group.teacherName || group.teacherId || '?').toString().slice(0,1).toUpperCase()}
                        </div>
                        <div className="font-semibold">{group.teacherName || group.teacherId}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700">Phòng {group.roomId}</div>
                    <div className="text-xs text-slate-700">
                      {group.startDate} → {group.endDate}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.slots.map((slot: any) => {
                        const key = `${slot.dayOfWeek}_${slot.timeSlot}`;
                        const dayLabel = DAY_LABELS[slot.dayOfWeek] || slot.dayOfWeek || '—';
                        const timeLabel = TIME_LABELS[slot.timeSlot] || slot.timeSlot || '—';
                        return (
                          <span key={key} className="px-2 py-0.5 text-xs rounded border border-slate-300 bg-slate-100 text-slate-700">
                            {dayLabel} — {timeLabel}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-auto">
                      <StudentList students={group.students} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-600 py-6 col-span-3">Chưa có đề xuất lịch hợp lệ.</div>
              )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 rounded bg-[#282d39] text-white">Đóng</AlertDialogCancel>
            {schedulePreview && (
              <button onClick={() => setConfirmSaveOpen(true)} disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Xác nhận lưu lịch</button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent variant="light" className="max-w-md w-[92vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu lịch</AlertDialogTitle>
            <AlertDialogDescription>Lưu kết quả AI Scheduler vào CSDL?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-100">Hủy</AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={() => {
                  setConfirmSaveOpen(false);
                  handleConfirmSchedule();
                }}
                disabled={saving}
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Lưu
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* 📄 Danh sách ghi danh */}
      <div className="border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="min-w-full text-sm bg-white text-slate-900">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3 text-slate-600">STT</th>
              <th className="text-left p-3 text-slate-600">Họ tên</th>
              <th className="text-left p-3 text-slate-600">Email</th>
              <th className="text-left p-3 text-slate-600">Ca học đã chọn</th>
              <th className="text-left p-3 text-slate-600">Trạng thái</th>
              <th className="text-left p-3 text-slate-600">Ngày ghi danh</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr><td colSpan={5} className="p-3">Đang tải...</td></tr>
            ) : err ? (
              <tr><td colSpan={6} className="p-3 text-red-400">Lỗi: {err}</td></tr>
            ) : (
              resp?.data?.map((r, i) => (
                <tr key={r.enrollmentId} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-3 text-slate-700">{(page - 1) * pageSize + i + 1}</td>
                  <td className="p-3">{r.learner.name ?? '—'}</td>
                  <td className="p-3">{r.learner.email}</td>
                  <td className="p-3"><SlotList slots={r.availableSlots} /></td>
                  <td className="p-3">
                    <span className={`text-xs rounded px-2 py-1 border ${
                      r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                      r.status === 'CANCELED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-slate-700">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
