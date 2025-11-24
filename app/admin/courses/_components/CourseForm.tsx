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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị preview tạm
    const blobPreview = URL.createObjectURL(file);
    setPreviewUrl(blobPreview);
    setFileName(file.name);

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Định dạng ảnh không hợp lệ",
        description: "Chỉ chấp nhận PNG, JPG, WEBP",
        variant: "destructive",
      });
      return;
    }

    // Upload lên server (API /api/upload)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "courses");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.url) {
        form.setValue("thumbnail", data.url); // ✅ URL thật (VD: /courses/1760798198172.png)
        setPreviewUrl(data.url); // cập nhật preview thật
        toast({ title: "Ảnh tải lên thành công!" });
      } else {
        toast({
          title: "Upload ảnh thất bại",
          description: data?.error ?? "Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi kết nối server upload",
        variant: "destructive",
      });
    }
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
        <button type="button" onClick={() => setOpen(!open)} className="h-11 w-full rounded-lg border border-[#3b4354] bg-[#0f1318] text-white text-left px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          {display || (placeholder || "mm/dd/yyyy")}
        </button>
        {open && (
          <div className="absolute z-20 mt-2 w-80 rounded-lg border border-[#3b4354] bg-[#1c1f27] shadow-lg">
            <div className="flex items-center justify-between p-2">
              <button type="button" onClick={() => setMonth(month.subtract(1, "month"))} className="p-1 rounded hover:bg-[#272b33]"><ChevronLeft className="h-4 w-4 text-white/80" /></button>
              <div className="text-white font-semibold">{month.format("MMMM YYYY")}</div>
              <button type="button" onClick={() => setMonth(month.add(1, "month"))} className="p-1 rounded hover:bg-[#272b33]"><ChevronRight className="h-4 w-4 text-white/80" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 px-2 text-xs text-white/60">
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
                    className={`h-9 rounded text-sm ${inMonth ? "text-white" : "text-white/40"} ${selected ? "bg-indigo-600" : isToday ? "bg-[#2a2f3a]" : "hover:bg-[#272b33]"}`}
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-white">
      <Card variant="dark" className="border-[#3b4354]">
        <CardHeader>
          <CardTitle>Thông tin khóa học</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block font-medium mb-1 text-white/80">Tên khóa học *</label>
            <Input className="h-11 rounded-lg border border-[#3b4354] bg-[#0f1318] text-white placeholder-white/60 focus-visible:ring-indigo-500/50" placeholder="VD: Blockchain Cơ Bản" {...form.register("title")} />
          </div>
          <div>
            <label className="block font-medium mb-1 text-white/80">Danh mục *</label>
            <Input className="h-11 rounded-lg border border-[#3b4354] bg-[#0f1318] text-white placeholder-white/60 focus-visible:ring-indigo-500/50" placeholder="VD: Công nghệ" {...form.register("category")} />
          </div>
          <div>
            <label className="block font-medium mb-1 text-white/80">Mô tả chi tiết</label>
            <div className="border border-[#3b4354] rounded-lg bg-[#0f1318]">
              <SafeReactQuill value={form.watch("description") || ""} onChange={(value: string) => form.setValue("description", value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="dark" className="border-[#3b4354]">
        <CardHeader>
          <CardTitle>Lịch trình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-white/80">Ngày bắt đầu</label>
              <DatePicker value={form.watch("startDate") || ""} onChange={(v) => form.setValue("startDate", v)} placeholder="mm/dd/yyyy" />
            </div>
            <div>
              <label className="block font-medium mb-1 text-white/80">Ngày kết thúc</label>
              <DatePicker value={form.watch("endDate") || ""} onChange={(v) => form.setValue("endDate", v)} placeholder="mm/dd/yyyy" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block font-medium mb-1 text-white/80">Ngày thi dự kiến</label>
            <DatePicker value={form.watch("examDateExpected") || ""} onChange={(v) => form.setValue("examDateExpected", v)} placeholder="mm/dd/yyyy" />
          </div>
        </CardContent>
      </Card>

      <Card variant="dark" className="border-[#3b4354]">
        <CardHeader>
          <CardTitle>Cài đặt hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block font-medium mb-1 text-white/80">Trạng thái *</label>
            <select {...form.register("status")} className="h-11 rounded-lg border border-[#3b4354] px-3 w-full bg-[#0f1318] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option value="UPCOMING">UPCOMING</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-indigo-600 h-4 w-4" {...form.register("isPublic")} />
            <label className="text-white/80">Công khai khóa học</label>
          </div>
        </CardContent>
      </Card>

      <Card variant="dark" className="border-[#3b4354]">
        <CardHeader>
          <CardTitle>Hình thu nhỏ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input id="thumbnailFile" type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
            <label htmlFor="thumbnailFile" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#3b4354] bg-[#0f1318] cursor-pointer text-white">
              <span>Chọn ảnh</span>
            </label>
            <span className="text-white/60 text-sm">{fileName || "Chưa chọn tệp"}</span>
          </div>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-3 w-48 h-32 object-cover rounded-lg border border-[#3b4354]" />
          )}
        </CardContent>
        <CardFooter>
          <Button disabled={loading} type="submit" className="h-11 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white w-full md:w-auto">
            {loading ? "Đang xử lý..." : mode === "create" ? "Tạo khóa học" : "Cập nhật khóa học"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
