"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("LEARNER");
  const [courseId, setCourseId] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/announcements/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Fetch failed");
        setTitle(json.title || "");
        setContent(json.content || "");
        setTargetRole(json.targetRole || "LEARNER");
        setCourseId(json.courseId ? String(json.courseId) : "");
        setIsPinned(Boolean(json.isPinned));
      } catch (e: any) {
        setError(e?.message || "Không thể tải thông báo");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      setCourses(json.data || json);
    })();
  }, []);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          targetRole,
          courseId: courseId || null,
          isPinned,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Update failed");
      router.push("/admin/announcements");
    } catch (e: any) {
      setError(e?.message || "Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 bg-[#111318] min-h-[calc(100vh-64px)]">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-white">Sửa thông báo</h1>
        <Card variant="dark" className="p-6 border-[#3b4354]">
          {loading ? (
            <div className="text-[#9da6b9]">Đang tải...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {error ? (
                <div className="text-sm text-red-400">{error}</div>
              ) : null}
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" className="border border-[#3b4354] bg-[#12151b] text-white" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung" className="rounded-md border border-[#3b4354] bg-[#12151b] text-white px-3 py-2 h-32" />
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2">
                <option value="LEARNER">LEARNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="ALL">ALL</option>
              </select>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="rounded-md border border-[#3b4354] bg-[#1c1f27] text-white px-3 py-2">
                <option value="">Không gán khóa học</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title} (#{c.id})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded-sm" />
                Hiển thị nổi bật (trang chủ)
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-[#3b4354] text-white" onClick={() => router.push("/admin/announcements")}>Hủy</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
