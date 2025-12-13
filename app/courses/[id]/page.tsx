"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// 🚀 ĐỊNH NGHĨA CÁC KHUNG GIỜ
const DAYS = [
  { label: "Thứ 2", value: "Mon" },
  { label: "Thứ 3", value: "Tue" },
  { label: "Thứ 4", value: "Wed" },
  { label: "Thứ 5", value: "Thu" },
  { label: "Thứ 6", value: "Fri" },
  { label: "Thứ 7", value: "Sat" },
  { label: "Chủ nhật", value: "Sun" },
];

const TIME_SLOTS = [
  { label: "17h45–19h15", value: "EVENING_1" },
  { label: "19h30–21h00", value: "EVENING_2" },
];

export default function CourseDetailPage() {
  // ❌ ĐÃ XÓA: const router = useRouter();
  // ❌ ĐÃ XÓA: const { id } = router.query;
  const queryClient = useQueryClient();
  const [enrolled, setEnrolled] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const params = useParams();
  const courseId = (params?.id as string) || null;

  // ✅ Lấy chi tiết khóa học
  const {
    data: course,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Mã khóa học không hợp lệ.");
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error("Không thể tải thông tin khóa học.");
      return res.json();
    },
    enabled: !!courseId,
  });

  // ✅ Kiểm tra xem user đã đăng ký khóa học chưa
  useEffect(() => {
    if (!courseId) return; // 🔧 THAY ĐỔI

    const checkEnrollment = async () => {
      try {
        const res = await fetch("/api/me/courses");
        if (!res.ok) return;

        const result = await res.json();
        const courseList = Array.isArray(result)
          ? result
          : Array.isArray(result.items)
          ? result.items
          : [];

        const found = courseList.some((c: any) => c.id === Number(courseId)); // 🔧 THAY ĐỔI
        setEnrolled(found);
      } catch {
        setEnrolled(false);
      }
    };

    checkEnrollment();
  }, [courseId]); // 🔧 THAY ĐỔI

  // 3. 🚀 Xử lý khi nhấn Đăng ký (ĐÃ CẬP NHẬT)
  const handleEnroll = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khung giờ có thể học.");
      return;
    }

    if (!courseId) { // 🔧 THAY ĐỔI
      toast.error("Không thể xác định mã khóa học. Vui lòng thử lại.");
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
// 🔧 THAY ĐỔI
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableSlots: selectedSlots,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Đăng ký thành công!");
        setEnrolled(true);
        queryClient.invalidateQueries({ queryKey: ["course", courseId] }); // 🔧 THAY ĐỔI
      } else if (res.status === 409) {
        toast.info(data.error || "Bạn đã đăng ký khóa học này.");
        setEnrolled(true);
      } else if (res.status === 401) {
        toast.error("Vui lòng đăng nhập để đăng ký.");
      } else if (res.status === 403) {
        toast.error("Chỉ học viên mới có thể đăng ký khóa học.");
      } else if (res.status === 400) {
        toast.error(
          data.error || "Vui lòng hoàn thiện hồ sơ trước khi đăng ký."
        );
      } else if (res.status === 428) {
        toast.error("Vui lòng hoàn thiện hồ sơ cá nhân.");
        setTimeout(() => {
          window.location.href = "/me/profile";
        }, 800);
      } else {
        toast.error(data.error || "Đã xảy ra lỗi không xác định.");
      }
    } catch {
      toast.error("Không thể kết nối tới máy chủ.");
    }
  };

  if (isLoading || !courseId)
    return (
      <main className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div>
              <Skeleton className="h-[480px] w-full" />
            </div>
          </div>
        </div>
      </main>
    );

  // ✅ Error UI
  if (isError || !course)
    return (
      <main className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>Không thể tải thông tin khóa học.</AlertDescription>
          </Alert>
        </div>
      </main>
    );

  return (
    <main className="bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Trang chủ</Link>
            <span className="mx-2">›</span>
            <Link href="/courses" className="hover:text-gray-700">Khóa học</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">{course.title}</span>
          </nav>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{course.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>TOEIC</Badge>
            <Badge>Level: {course.category || "-"}</Badge>
            <Badge>
              Ngày cập nhật: {course.endDate || course.startDate ? dayjs(course.endDate || course.startDate).format("DD/MM/YYYY") : "-"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bạn sẽ học được gì</h3>
              {(() => {
                const raw = String(course.description || "");
                const items = (() => {
                  try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(raw, "text/html");
                    return Array.from(doc.querySelectorAll("li"))
                      .map((li) => (li.textContent || "").trim())
                      .filter(Boolean)
                      .slice(0, 10);
                  } catch {
                    return [] as string[];
                  }
                })();
                return items.length ? (
                  <ul className="grid grid-cols-1 gap-6">
                    {items.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="mt-1 h-6 w-6 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Nội dung sẽ được cập nhật.</p>
                );
              })()}
            </div>

            <div className="space-y-4">
              <details className="group rounded-xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer text-base font-semibold text-gray-900">Mô tả khóa học</summary>
                {(() => {
                  const raw = String(course.description || "");
                  const clean = (() => {
                    try {
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(raw, "text/html");
                      doc.querySelectorAll("img").forEach((img) => {
                        const src = img.getAttribute("src") || "";
                        if (!src || src === "#") {
                          img.remove();
                        } else {
                          img.classList.add("max-w-full", "rounded-md", "border", "border-gray-200", "mx-auto", "my-3");
                        }
                      });
                      doc.querySelectorAll("a").forEach((a) => {
                        a.classList.add("text-blue-600", "underline", "underline-offset-2");
                      });
                      doc.querySelectorAll("p, li, span").forEach((el) => {
                        el.classList.add("text-gray-700");
                      });
                      return DOMPurify.sanitize(doc.body.innerHTML);
                    } catch {
                      return DOMPurify.sanitize(raw);
                    }
                  })();
                  return <div className="pt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: clean }} />;
                })()}
              </details>

              <details className="group rounded-xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer text-base font-semibold text-gray-900">Thông tin khóa học</summary>
                <div className="pt-4 text-sm text-gray-700 space-y-1">
                  <p>📅 Bắt đầu: {course.startDate ? dayjs(course.startDate).format("DD/MM/YYYY") : "-"}</p>
                  <p>🏁 Kết thúc: {course.endDate ? dayjs(course.endDate).format("DD/MM/YYYY") : "-"}</p>
                  <p>🧮 Ngày thi dự kiến: {course.examDateExpected ? dayjs(course.examDateExpected).format("DD/MM/YYYY") : "-"}</p>
                  <p>📚 Danh mục: {course.category || "-"}</p>
                  <p>⚑ Trạng thái: {course.status}</p>
                </div>
              </details>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Giảng viên</h3>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden"></div>
                <div>
                  <p className="font-medium text-gray-900">Đang cập nhật</p>
                  <p className="text-sm text-gray-600">Thông tin giảng viên sẽ được cập nhật.</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <Card className="bg-white shadow-xl rounded-2xl border border-gray-100 sticky top-24">
              <CardContent>
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail.startsWith("/") ? course.thumbnail : `/courses/${course.thumbnail}`}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16' font-family='Arial'>No Image</text></svg>";
                      }}
                    />
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">Học phí: Liên hệ</div>
                </div>

                {!enrolled && (
                  <div className="mt-6">
                    <h4 className="text-base font-semibold text-gray-900">Chọn lịch học</h4>
                    <div className="mt-3 space-y-4">
                      {TIME_SLOTS.map((slot) => (
                        <div key={slot.value}>
                          <div className="text-sm font-medium text-gray-900">{slot.label}</div>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {DAYS.map((day) => {
                              const slotId = `${day.value}_${slot.value}`;
                              const active = selectedSlots.includes(slotId);
                              return (
                                <button
                                  type="button"
                                  key={slotId}
                                  onClick={() => {
                                    setSelectedSlots((prev) =>
                                      active ? prev.filter((s) => s !== slotId) : [...prev, slotId]
                                    );
                                  }}
                                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                                    active
                                      ? "border-blue-600 bg-blue-50 text-blue-700"
                                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {!enrolled ? (
                    <Button
                      onClick={handleEnroll}
                      disabled={course.status !== "UPCOMING"}
                      className={`w-full ${
                        course.status === "UPCOMING"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-400 text-white cursor-not-allowed"
                      } py-6 text-base font-semibold`}
                    >
                      {course.status === "UPCOMING" ? "Đăng ký ngay" : "Khóa học đã bắt đầu / kết thúc"}
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button disabled className="flex-1 bg-green-600 text-white">✅ Đã đăng ký</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="flex-1" variant="destructive">Hủy đăng ký</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này sẽ hủy đăng ký khóa học của bạn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                if (!courseId) {
                                  toast.error("Lỗi: Không tìm thấy mã khóa học.");
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "DELETE" });
                                  const data = await res.json();
                                  if (res.ok) {
                                    toast.success(data.message || "Đã hủy đăng ký.");
                                    setEnrolled(false);
                                  } else {
                                    toast.error(data.error || "Hủy đăng ký thất bại.");
                                  }
                                } catch {
                                  toast.error("Không thể kết nối máy chủ.");
                                }
                              }}
                            >
                              Tiếp tục hủy
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Tư vấn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

