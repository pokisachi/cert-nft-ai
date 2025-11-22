"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // 🔧 THAY ĐỔI LỚN: Dùng state để lưu ID từ URL
  const [courseId, setCourseId] = useState<string | null>(null);

  // 🔧 THÊM: Lấy ID từ URL bằng web API (chạy 1 lần khi mount)
  useEffect(() => {
    // Chỉ chạy ở phía client
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split("/");
      // Giả sử URL là /courses/[id], id sẽ là phần tử cuối
      const id = pathSegments.pop() || null;
      if (id && !isNaN(Number(id))) {
        setCourseId(id);
      } else {
        // Xử lý nếu URL không đúng (ví dụ: /courses/abc)
        console.error("Không thể parse ID từ URL:", window.location.pathname);
      }
    }
  }, []); // Chạy 1 lần duy nhất

  // ✅ Lấy chi tiết khóa học
  const {
    data: course,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["course", courseId], // 🔧 THAY ĐỔI: Dùng courseId từ state
    queryFn: async () => {
      if (!courseId) { // 🔧 THAY ĐỔI: Dùng courseId từ state
        throw new Error("Mã khóa học không hợp lệ.");
      }
      const res = await fetch(`/api/courses/${courseId}`); // 🔧 THAY ĐỔI
      if (!res.ok) throw new Error("Không thể tải thông tin khóa học.");
      return res.json();
    },
    enabled: !!courseId, // 🔧 THAY ĐỔI: Chỉ query khi courseId đã sẵn sàng
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
      } catch (err) {
        console.error("Lỗi khi kiểm tra enrollment:", err);
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
    } catch (err) {
      toast.error("Không thể kết nối tới máy chủ.");
    }
  };

  // ✅ Loading UI
  if (isLoading || !courseId) // 🔧 THAY ĐỔI: Chờ courseId sẵn sàng
    return (
      <main className="max-w-4xl mx-auto p-8">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </main>
    );

  // ✅ Error UI
  if (isError || !course)
    return (
      <main className="max-w-4xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không thể tải thông tin khóa học.
          </AlertDescription>
        </Alert>
      </main>
    );

  // ✅ Render chi tiết khóa học
  return (
    <main className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Ảnh khóa học */}
          <div className="relative w-full aspect-[16/9] mb-6 rounded-lg overflow-hidden bg-gray-100">
            {course.thumbnail ? (
              <img
                src={
                  course.thumbnail.startsWith("/")
                    ? course.thumbnail
                    : `/courses/${course.thumbnail}`
                }
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "data:image/svg+xml;charset=utf-8,\
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'>\
                      <rect width='100%' height='100%' fill='%23f3f4f6'/>\
                      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16' font-family='Arial'>No Image</text>\
                    </svg>";
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>

          {/* Mô tả khóa học */}
          <div
            className="prose prose-indigo prose-sm sm:prose-base lg:prose-lg max-w-none mb-4 text-gray-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }}
          />

          {/* Thông tin chi tiết */}
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <p>
              📅 Bắt đầu:{" "}
              {course.startDate
                ? dayjs(course.startDate).format("DD/MM/YYYY")
                : "-"}
            </p>
            <p>
              🏁 Kết thúc:{" "}
              {course.endDate
                ? dayjs(course.endDate).format("DD/MM/YYYY")
                : "-"}
            </p>
            <p>
              🧮 Ngày thi dự kiến:{" "}
              {course.examDateExpected
                ? dayjs(course.examDateExpected).format("DD/MM/YYYY")
                : "-"}
            </p>
            <p>📚 Danh mục: {course.category || "-"}</p>
          </div>

          {/* 2. 🚀 GIAO DIỆN CHỌN LỊCH MỚI (DẠNG BẢNG) */}
          {!enrolled && (
            <div className="mb-4">
              <h3 className="text-base font-medium mb-3 text-gray-800">
                Vui lòng chọn TẤT CẢ các khung giờ bạn có thể học:
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ca học
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day.value}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot.value}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {slot.label}
                        </td>
                        {DAYS.map((day) => {
                          // Tạo ID duy nhất, ví dụ: "Mon_EVENING_1"
                          const slotId = `${day.value}_${slot.value}`;
                          const active = selectedSlots.includes(slotId);

                          return (
                            <td
                              key={slotId}
                              onClick={() => {
                                setSelectedSlots((prev) =>
                                  active
                                    ? prev.filter((s) => s !== slotId)
                                    : [...prev, slotId]
                                );
                              }}
                              className={`px-4 py-3 text-center cursor-pointer transition-colors text-lg font-semibold ${
                                active
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-white text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {active ? "✓" : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex gap-4 mt-8">
            {!enrolled ? (
              <Button
                onClick={handleEnroll}
                disabled={course.status !== "UPCOMING"}
                className={`${
                  course.status === "UPCOMING"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {course.status === "UPCOMING"
                  ? "Đăng ký khóa học"
                  : "Khóa học đã bắt đầu / kết thúc"}
              </Button>
            ) : (
              <>
                <Button disabled className="bg-green-600 text-white">
                  ✅ Đã đăng ký
                </Button>

                {/* 4. 🚀 THAY THẾ confirm() BẰNG AlertDialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Hủy đăng ký</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này sẽ hủy đăng ký khóa học của bạn. Bạn
                        có thể đăng ký lại sau nếu muốn.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={async () => {
                          if (!courseId) { // 🔧 THAY ĐỔI
                            toast.error("Lỗi: Không tìm thấy mã khóa học.");
                            return;
                          }
                          // Logic Hủy đăng ký (không cần confirm)
                          try {
                            const res = await fetch(
                              `/api/courses/${courseId}/enroll`, // 🔧 THAY ĐỔI
                              {
                                method: "DELETE",
                              }
                            );
                            const data = await res.json();

                            if (res.ok) {
                              toast.success(
                                data.message || "Đã hủy đăng ký."
                              );
                              setEnrolled(false);
                            } else {
                              toast.error(
                                data.error || "Hủy đăng ký thất bại."
                              );
                            }
                          } catch (err) {
                            toast.error("Không thể kết nối máy chủ.");
                          }
                        }}
                      >
                        Tiếp tục hủy
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              Tư vấn
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

