"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const DAYS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

const TIME_SLOTS = [
  { label: "17h45–19h15", value: "EVENING_1" },
  { label: "19h30–21h00", value: "EVENING_2" },
];

export default function CourseDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [enrolled, setEnrolled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // ✅ Lấy chi tiết khóa học
  const {
    data: course,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Không thể tải thông tin khóa học.");
      return res.json();
    },
  });

  // ✅ Kiểm tra xem user đã đăng ký khóa học chưa
  useEffect(() => {
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

        const found = courseList.some((c: any) => c.id === Number(id));
        setEnrolled(found);
      } catch (err) {
        console.error("Lỗi khi kiểm tra enrollment:", err);
        setEnrolled(false);
      }
    };

    checkEnrollment();
  }, [id]);

  // 🧾 Xử lý khi nhấn Đăng ký
  const handleEnroll = async () => {
    if (selectedDays.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ngày học.");
      return;
    }
    if (!selectedTime) {
      toast.error("Vui lòng chọn ca học.");
      return;
    }

    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredDays: selectedDays.join(","), // CSV
          preferredTime: selectedTime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Đăng ký thành công!");
        setEnrolled(true);
        queryClient.invalidateQueries({ queryKey: ["course", id] });
      } else if (res.status === 409) {
        toast.info(data.error || "Bạn đã đăng ký khóa học này.");
        setEnrolled(true);
      } else if (res.status === 401) {
        toast.error("Vui lòng đăng nhập để đăng ký.");
      } else if (res.status === 403) {
        toast.error("Chỉ học viên mới có thể đăng ký khóa học.");
      } else if (res.status === 400) {
        toast.error(data.error || "Vui lòng hoàn thiện hồ sơ trước khi đăng ký.");
      } else {
        toast.error(data.error || "Đã xảy ra lỗi không xác định.");
      }
    } catch (err) {
      toast.error("Không thể kết nối tới máy chủ.");
    }
  };

  // ✅ Loading UI
  if (isLoading)
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
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>

          {/* Mô tả khóa học */}
          <p className="text-gray-700 leading-relaxed mb-4">
            {course.description}
          </p>

          {/* Thông tin chi tiết */}
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <p>📅 Bắt đầu: {course.startDate ? dayjs(course.startDate).format("DD/MM/YYYY") : "-"}</p>
            <p>🏁 Kết thúc: {course.endDate ? dayjs(course.endDate).format("DD/MM/YYYY") : "-"}</p>
            <p>🧮 Ngày thi dự kiến: {course.examDateExpected ? dayjs(course.examDateExpected).format("DD/MM/YYYY") : "-"}</p>
            <p>📚 Danh mục: {course.category || "-"}</p>
          </div>

          {/* 🗓️ Chọn Thứ học */}
          {!enrolled && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Chọn thứ học:</h3>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDays((prev) =>
                          active
                            ? prev.filter((d) => d !== day)
                            : [...prev, day]
                        )
                      }
                      className={`px-3 py-1 rounded border ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ⏰ Chọn Ca học */}
          {!enrolled && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Chọn ca học:</h3>
              <div className="flex flex-wrap gap-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedTime(slot.value)}
                    className={`px-3 py-1 rounded border ${
                      selectedTime === slot.value
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
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

                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm("Bạn có chắc muốn hủy đăng ký khóa học này không?")) return;
                      try {
                        const res = await fetch(`/api/courses/${id}/enroll`, {
                          method: "DELETE",
                        });
                        const data = await res.json();

                        if (res.ok) {
                          toast.success(data.message || "Đã hủy đăng ký.");
                          setEnrolled(false);
                        } else {
                          toast.error(data.error || "Hủy đăng ký thất bại.");
                        }
                      } catch (err) {
                        toast.error("Không thể kết nối máy chủ.");
                      }
                    }}
                  >
                    Hủy đăng ký
                  </Button>
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
