'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

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
};

// ============================
// Hiển thị slot chọn
// ============================
function SlotList({ slots }: { slots: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!slots?.length) return <>—</>;

  const sorted = [...slots].sort((a, b) => {
    const [dayA] = a.split('_');
    const [dayB] = b.split('_');
    return DAY_ORDER.indexOf(dayA) - DAY_ORDER.indexOf(dayB);
  });

  const visible = expanded ? sorted : sorted.slice(0, 1);

  const parseSlotLabel = (slot: string) => {
    const [day, time] = slot.split('_');
    const dayLabel = DAY_LABELS[day] || day || '—';
    const timeLabel = TIME_LABELS[time] || '—';
    if (typeof timeLabel === 'string' && timeLabel.includes('(')) {
      return `${dayLabel} ${timeLabel}`;
    }
    return `${dayLabel} (${timeLabel})`;
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {visible.map((slot) => (
          <span key={slot} className="px-2 py-1 text-xs border rounded bg-indigo-50 text-indigo-700 whitespace-nowrap">
            {parseSlotLabel(slot)}
          </span>
        ))}
      </div>
      {sorted.length > 1 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-600 hover:underline mt-1">
          {expanded ? 'Thu gọn ▲' : `Xem thêm (${sorted.length - 1}) ▼`}
        </button>
      )}
    </div>
  );
}

// ============================
// Hiển thị học viên trong lớp
// ============================
function StudentList({ students }: { students: any[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!students?.length) return <>Chưa có học viên</>;

  // 🧠 sort theo tên + email để hiển thị ổn định
  const sorted = [...students].sort((a, b) =>
    (a.learner?.name || '').localeCompare(b.learner?.name || '')
  );
  const visible = expanded ? sorted : sorted.slice(0, 1);

  return (
    <div className="space-y-0.5">
      {visible.map((enr: any, i: number) => (
        <div key={i} className="text-sm">
          {enr.learner?.name || '—'} <span className="text-gray-500">({enr.learner?.email || '—'})</span>
        </div>
      ))}
      {students.length > 1 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-600 hover:underline mt-1">
          {expanded ? '▲ Thu gọn' : `▼ Xem thêm (${students.length - 1})`}
        </button>
      )}
      <div className="text-xs text-gray-500 mt-1">Tổng: {students.length} HV</div>
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
  if (!confirm(`Chạy AI Scheduler cho khóa "${courseTitle}"?`)) return;
  
  setLoading(true);
  
  try {
    const res = await fetch('/api/admin/scheduler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: Number(id), dry: true }),
    });
    
    const result = await res.json();
    
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
      
      console.log('✅ Đã lưu vào state:');
      console.log('   Classes:', result.data.scheduledClasses?.length);
      console.log('   Enrollments:', result.data.scheduledEnrollments?.length);
    } else {
      alert(result.error || 'Lỗi khi tạo lịch');
      console.error('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
    alert('Lỗi khi gọi API scheduler');
  } finally {
    setLoading(false);
  }
};


  // 💾 Xác nhận lưu
  const handleConfirmSchedule = async () => {
    if (!schedulePreview) return;
    if (!confirm('Xác nhận lưu lịch học này vào CSDL?')) return;
    setSaving(true);
    const res = await fetch('/api/admin/scheduler/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: Number(id), schedule: schedulePreview }),
    });
    const data = await res.json();
    setSaving(false);
    alert(data.message || 'Đã lưu lịch thành công!');
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Ghi danh khóa học: <span className="text-indigo-700">{courseTitle}</span>
        </h1>
        <div className="flex gap-3">
          <button onClick={handleRunScheduler} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            🧠 Tạo lịch tự động
          </button>
          {schedulePreview && (
            <button onClick={handleConfirmSchedule} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              💾 Xác nhận lưu lịch
            </button>
          )}
        </div>
      </div>

     {/* 🧠 Kết quả AI Scheduler */}
{schedulePreview && (
  <div className="border rounded bg-gray-50 p-4">
    <h2 className="text-lg font-medium mb-2">📋 Kết quả đề xuất:</h2>
    <table className="min-w-full text-sm border">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-2 border">Lịch học (3 buổi/tuần)</th>
          <th className="p-2 border">Giáo viên</th>
          <th className="p-2 border">Phòng</th>
          <th className="p-2 border">Bắt đầu</th>
          <th className="p-2 border">Kết thúc</th>
          <th className="p-2 border">Học viên</th>
        </tr>
      </thead>
      <tbody>
        {groupedSchedules.length > 0 ? (
          groupedSchedules.map((group: any, idx: number) => (
            <tr key={idx} className="border-t align-top">
              <td className="p-2 border align-top">
                <div className="space-y-1 text-sm">
                  <div className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                    {group.slots.length} buổi / tuần
                  </div>
                  <ul className="space-y-1">
                    {group.slots.map((slot: any) => {
                      const key = `${slot.dayOfWeek}_${slot.timeSlot}`;
                      const dayLabel = DAY_LABELS[slot.dayOfWeek] || slot.dayOfWeek || '—';
                      const timeLabel = TIME_LABELS[slot.timeSlot] || slot.timeSlot || '—';
                      return (
                        <li key={key} className="flex items-start gap-2 text-sm">
                          <span className="text-indigo-500">•</span>
                          <span>{dayLabel} — {timeLabel}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </td>
              <td className="p-2 border">{group.teacherName || group.teacherId}</td>
              <td className="p-2 border">{group.roomId}</td>
              <td className="p-2 border">{group.startDate}</td>
              <td className="p-2 border">{group.endDate}</td>
              <td className="p-2 border align-top">
                <StudentList students={group.students} />
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="p-3 text-center text-gray-500">
              Chưa có đề xuất lịch hợp lệ.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}


      {/* 📄 Danh sách ghi danh */}
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Họ tên</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Ca học đã chọn</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Ngày ghi danh</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-3">Đang tải...</td></tr>
            ) : err ? (
              <tr><td colSpan={5} className="p-3 text-red-600">Lỗi: {err}</td></tr>
            ) : (
              resp?.data?.map((r) => (
                <tr key={r.enrollmentId} className="border-t">
                  <td className="p-3">{r.learner.name ?? '—'}</td>
                  <td className="p-3">{r.learner.email}</td>
                  <td className="p-3"><SlotList slots={r.availableSlots} /></td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
