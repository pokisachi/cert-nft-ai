"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import dynamic from "next/dynamic";
import SafeReactQuill from "@/components/SafeReactQuill";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";





const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};


const CourseSchema = z.object({
  title: z.string().min(3, "Tên khóa học bắt buộc"),
  category: z.string().min(2, "Danh mục bắt buộc"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  examDateExpected: z.string().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CLOSED"]),
  isPublic: z.boolean(),
  thumbnail: z.string().optional(),
});

type CourseFormData = z.infer<typeof CourseSchema>;

interface CourseFormProps {
  mode: "create" | "edit";
  id?: string;
}

export function CourseForm({ mode, id }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(""); // 👈 preview riêng
  const [fileName, setFileName] = useState<string>("");

  const form = useForm<CourseFormData>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      startDate: "",
      endDate: "",
      examDateExpected: "",
      status: "UPCOMING",
      isPublic: true,
      thumbnail: "",
    },
  });

  // ✅ Load dữ liệu khi edit
  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        const res = await fetch(`/api/admin/courses/${id}`);
        if (res.ok) {
          const data = await res.json();
          form.reset({
            title: data.title ?? "",
            category: data.category ?? "",
            description: data.description ?? "",
            startDate: data.startDate ? data.startDate.slice(0, 10) : "",
            endDate: data.endDate ? data.endDate.slice(0, 10) : "",
            examDateExpected: data.examDateExpected
              ? data.examDateExpected.slice(0, 10)
              : "",
            status: data.status ?? "UPCOMING",
            isPublic: data.isPublic ?? true,
            thumbnail: data.thumbnail ?? "",
          });
          if (data.thumbnail) setPreviewUrl(data.thumbnail);
        }
      })();
    }
  }, [mode, id, form]);

  // ✅ Upload thật + preview đúng cách
  const uploadFile = async (file: File) => {
    const blobPreview = URL.createObjectURL(file);
    setPreviewUrl(blobPreview);
    setFileName(file.name);

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Định dạng ảnh không hợp lệ", description: "Chỉ chấp nhận PNG, JPG, WEBP", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "courses");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data?.url) {
        form.setValue("thumbnail", data.url);
        setPreviewUrl(data.url);
        toast({ title: "Ảnh tải lên thành công!" });
      } else {
        toast({ title: "Upload ảnh thất bại", description: data?.error ?? "Vui lòng thử lại.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi kết nối server upload", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  };

  // ✅ Gửi dữ liệu tạo/sửa khóa học
  const onSubmit: SubmitHandler<CourseFormData> = async (values) => {
    setLoading(true);
    const method = mode === "create" ? "POST" : "PUT";
    const url =
      mode === "create"
        ? "/api/admin/courses"
        : `/api/admin/courses/${id}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);

    if (res.ok) {
      toast({
        title:
          mode === "create"
            ? "Tạo khóa học thành công 🎉"
            : "Cập nhật khóa học thành công ✅",
      });
      router.push("/admin/courses");
    } else {
      const data = await res.json();
      toast({
        title: "Lỗi khi lưu dữ liệu",
        description: data?.error || "Không thể lưu khóa học",
        variant: "destructive",
      });
    }
  };

  function DatePicker({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) {
    const [open, setOpen] = useState(false);
    const initialMonth = value && dayjs(value).isValid() ? dayjs(value) : dayjs();
    const [month, setMonth] = useState(initialMonth);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        const el = ref.current;
        if (open && el && !el.contains(e.target as Node)) setOpen(false);
      };
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", keyHandler);
      return () => {
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("keydown", keyHandler);
      };
    }, [open]);
    const start = month.startOf("month");
    const days: dayjs.Dayjs[] = [];
    const first = start.day();
    for (let i = 0; i < first; i++) days.push(start.subtract(first - i, "day"));
    const total = month.daysInMonth();
    for (let i = 0; i < total; i++) days.push(start.add(i, "day"));
    const tail = 42 - days.length;
    for (let i = 1; i <= tail; i++) days.push(start.add(total + i - 1, "day"));

    const display = value && dayjs(value).isValid() ? dayjs(value).format("DD/MM/YYYY") : "";

    return (
      <div className="relative" ref={ref}>
        <button type="button" onClick={() => setOpen(!open)} className="h-11 w-full rounded-lg border border-gray-300 bg-white text-gray-900 text-left px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          {display || (placeholder || "mm/dd/yyyy")}
        </button>
        {open && (
          <div className="absolute z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between p-2">
              <button type="button" onClick={() => setMonth(month.subtract(1, "month"))} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="h-4 w-4 text-gray-700" /></button>
              <div className="text-gray-800 font-semibold">{month.format("MMMM YYYY")}</div>
              <button type="button" onClick={() => setMonth(month.add(1, "month"))} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="h-4 w-4 text-gray-700" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 px-2 text-xs text-gray-500">
              {"CN T2 T3 T4 T5 T6 T7".split(" ").map((d) => (
                <div key={d} className="text-center py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-2">
              {days.map((d, i) => {
                const inMonth = d.month() === month.month();
                const isToday = d.isSame(dayjs(), "day");
                const selected = value && d.isSame(dayjs(value), "day");
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(d.format("YYYY-MM-DD"));
                      setOpen(false);
                    }}
                    className={`h-9 rounded text-sm ${inMonth ? "text-gray-900" : "text-gray-400"} ${selected ? "bg-blue-600 text-white" : isToday ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100"}`}
                  >
                    {d.date()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form id="course-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin khóa học</h2>
            <div className="space-y-5">
              <div>
                <label className="block font-medium mb-1 text-gray-700">Tên khóa học *</label>
                <Input className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus-visible:ring-blue-500" placeholder="VD: Blockchain Cơ Bản" {...form.register("title")} />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-700">Danh mục *</label>
                <select {...form.register("category")} className="h-11 rounded-lg border border-gray-300 px-3 w-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn danh mục</option>
                  <option value="Công nghệ">Công nghệ</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Thiết kế">Thiết kế</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-700">Mô tả chi tiết</label>
                <div className="border border-gray-200 rounded-lg bg-white">
                  <SafeReactQuill value={form.watch("description") || ""} onChange={(value: string) => form.setValue("description", value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thời gian đào tạo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-gray-700">Ngày bắt đầu</label>
                <DatePicker value={form.watch("startDate") || ""} onChange={(v) => form.setValue("startDate", v)} placeholder="mm/dd/yyyy" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-700">Ngày kết thúc</label>
                <DatePicker value={form.watch("endDate") || ""} onChange={(v) => form.setValue("endDate", v)} placeholder="mm/dd/yyyy" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1 text-gray-700">Ngày thi dự kiến</label>
                <DatePicker value={form.watch("examDateExpected") || ""} onChange={(v) => form.setValue("examDateExpected", v)} placeholder="mm/dd/yyyy" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái & Hiển thị</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Trạng thái *</label>
                  <select {...form.register("status")} className="h-11 rounded-lg border border-gray-300 px-3 w-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-green-600 h-4 w-4" {...form.register("isPublic")} />
                  <span className="text-gray-700">Công khai khóa học</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ảnh bìa khóa học</h2>
              <input id="thumbnailFile" type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
              <div
                className="border-dashed border-2 border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition"
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) uploadFile(file);
                }}
              >
                <label htmlFor="thumbnailFile" className="block cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-500"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 12v6m0-6l-3 3m3-3l3 3M16 8a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="font-medium">Kéo thả hoặc bấm để chọn ảnh</span>
                    <span className="text-sm text-gray-500">PNG, JPG, WEBP • Tối đa 5MB</span>
                  </div>
                </label>
              </div>
              {fileName && <div className="mt-3 text-sm text-gray-600">{fileName}</div>}
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="mt-4 w-full max-h-48 object-cover rounded-lg border border-gray-200" />
              )}
            </div>

            {mode === "edit" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <button disabled={loading} type="submit" className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Đang xử lý..." : "Cập nhật khóa học"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
