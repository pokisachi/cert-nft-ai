//D:\2025-2026\src_Code\cert-nft\app\admin\exams\[sessionId]\results\page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { use } from "react";

type Row = {
  examResultId: number;
  user: { id: number; name: string; dob: string | null; email?: string };
  score: number | null;
  status: "PENDING" | "PASS" | "FAIL";
  eligible: boolean;
  locked: boolean;
  certificate: { id: number | null; verifyUrl: string | null };
};

type AIResult = {
  certId: string;
  similarityScore: number;
  status: "unique" | "duplicate" | "error";
  matchedWith?: { refDocHash: string; score: number }[];
};

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [renderedList, setRenderedList] = useState<any[]>([]);
  const [aiResults, setAIResults] = useState<AIResult[]>([]);
  const [aiChecked, setAIChecked] = useState(false);

  // 🔹 Load dữ liệu ca thi
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/admin/exams/${sessionId}/results`),
          fetch(`/api/admin/exam-sessions/${sessionId}`),
        ]);
        const data1 = await res1.json();
        const data2 = await res2.json();
        if (res1.ok) setRows(data1.data);
        else toast.error(data1.error);
        if (res2.ok) setSessionInfo(data2);
        else toast.error(data2.error);
      } catch (e: any) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, [sessionId]);

  // 🔹 Lưu điểm thi
  const handleSave = async (examResultId: number, score: number | null) => {
    if (!examResultId) return toast.error("Thiếu ID kết quả thi!");
    const res = await fetch(`/api/admin/exam-results/${examResultId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success(json.message || "✅ Lưu điểm thành công!");
      setRows((prev) =>
        prev.map((r) =>
          r.examResultId === examResultId
            ? { ...r, score, status: json.status, eligible: json.eligible }
            : r
        )
      );
    } else toast.error(json.error || "❌ Lưu thất bại");
  };

  // 🎓 Render chứng chỉ từng học viên
  const handleRenderOne = async (r: Row) => {
    try {
      toast.info(`Đang tạo chứng chỉ cho ${r.user.name}...`);
      const res = await fetch(`/api/certificates/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examResultId: r.examResultId,
          issue_date: new Date().toISOString().split("T")[0],
          expiry_date: "2027-11-07",
          certificate_code: `BF-${new Date().getFullYear()}-${r.examResultId}`,
          issuer_name: "UNET.edu.vn",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRenderedList((prev) => [...prev, { ...data, name: r.user.name }]);
        toast.success(`✅ Đã tạo chứng chỉ cho ${r.user.name}`);
      } else toast.error(data.error || "❌ Không thể tạo chứng chỉ");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi render chứng chỉ");
    }
  };

  // 🧩 Render tất cả học viên PASS
  const handleRenderAll = async () => {
    const passList = rows.filter((r) => r.status === "PASS" && !r.locked);
    if (!passList.length)
      return toast.error("Không có học viên nào đủ điều kiện.");

    toast.info(`Đang tạo chứng chỉ cho ${passList.length} học viên...`);
    const rendered: any[] = [];

    for (const r of passList) {
      try {
        const res = await fetch(`/api/certificates/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examResultId: r.examResultId,
            issue_date: new Date().toISOString().split("T")[0],
            expiry_date: "2027-11-07",
            certificate_code: `BF-${new Date().getFullYear()}-${r.examResultId}`,
            issuer_name: "UNET.edu.vn",
          }),
        });
        const data = await res.json();
        if (res.ok) rendered.push({ ...data, name: r.user.name });
      } catch (err) {
        console.error(err);
      }
    }

    if (!rendered.length)
      return toast.error("Không tạo được chứng chỉ nào.");
    setRenderedList(rendered);
    toast.success("✅ Render chứng chỉ tạm thành công!");
  };

  // ⬇️ Tải xuống tất cả chứng chỉ
  const handleDownloadAll = async () => {
    if (!renderedList.length)
      return toast.error("Chưa có chứng chỉ nào để tải.");

    toast.info("Đang tải chứng chỉ...");
    for (const c of renderedList) {
      if (!c.pdf?.base64) continue;
      const blob = new Blob(
        [Uint8Array.from(atob(c.pdf.base64), (ch) => ch.charCodeAt(0))],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${c.name}_certificate.pdf`;
      a.click();
    }
    toast.success("🎉 Tải hoàn tất!");
  };

  // 🤖 Gửi PDF thật lên AI Dedup + Lưu DB qua Next API
  const handleAICheck = async () => {
    if (!renderedList.length)
      return toast.error("Không có chứng chỉ nào để kiểm tra.");

    toast.info("🤖 Đang gửi dữ liệu PDF thật lên AI Dedup Service...");

    try {
      const items = renderedList.map((c) => ({
        certId: String(c.preIssueHash || c.metadata?.examResultId || `cert-${Math.random()}`),
        studentName: c.name || "UNKNOWN",
        dob: "",
        course: c.metadata?.profile || "UNKNOWN",
        pdfBase64: c.pdf?.base64?.trim() || "",
        examResultId: c.metadata?.examResultId,
        userId: c.metadata?.userId,
        courseId: c.metadata?.courseId,
      }));

      const validItems = items.filter((i) => i.pdfBase64.length > 0);
      if (!validItems.length)
        return toast.error("Không có PDF hợp lệ để gửi lên AI.");

      const res = await fetch(
        "http://localhost:8001/api/admin/certificates/ai-dedup-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: validItems,
            options: { topK: 3, thresholdUnique: 0.8, thresholdDuplicate: 0.95 },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("AI Dedup Error:", data);
        return toast.error(`AI lỗi: ${data.detail || "422 Unprocessable Entity"}`);
      }

      setAIResults(data.results || []);
      setAIChecked(true);
      toast.success(`✅ AI xử lý ${data.results?.length || 0} chứng chỉ!`);

      // 🔸 Ghi từng kết quả AI vào DB qua API Next.js
      for (let i = 0; i < validItems.length; i++) {
        const c = validItems[i];
        try {
          await fetch("/api/internal/ai/check-and-save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examResultId: c.examResultId,
              userId: c.userId,
              courseId: c.courseId,
              pdfPreviewBase64: c.pdfBase64,
            }),
          });
        } catch (err) {
          console.warn("⚠️ Không thể lưu AI Dedup result:", err);
        }
      }
    } catch (err) {
      console.error("AI check failed:", err);
      toast.error("❌ Không thể kết nối tới AI Service.");
    }
  };

  if (loading) return <p className="p-6">Đang tải...</p>;

  const title =
    sessionInfo && sessionInfo.course
      ? `${sessionInfo.course.title} (${sessionInfo.room} - ${new Date(
          sessionInfo.date
        ).toLocaleDateString("vi-VN")})`
      : `#${sessionId}`;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nhập điểm thi khóa học: {title}</h1>

      <div className="flex justify-end gap-3 mb-3">
        <Button
          onClick={handleRenderAll}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          🧩 Tạo tất cả chứng chỉ
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 mt-4">❌ Hiện chưa có học viên nào.</p>
      ) : (
        <table className="min-w-full border-collapse bg-white rounded shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Ngày sinh</th>
              <th className="p-3 text-left">Điểm</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.examResultId} className="border-t">
                <td className="p-3">{r.user.name}</td>
                <td className="p-3">
                  {r.user.dob
                    ? new Date(r.user.dob).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={r.score ?? ""}
                    min={0}
                    max={990}
                    className="border rounded px-2 py-1 w-20"
                    disabled={r.locked}
                    onBlur={(e) =>
                      handleSave(r.examResultId, Number(e.target.value))
                    }
                  />
                </td>
                <td className="p-3">
                  {r.status === "PASS" && "✅ PASS"}
                  {r.status === "FAIL" && "❌ FAIL"}
                  {r.status === "PENDING" && "⌛ Đang chờ"}
                </td>
                <td className="p-3 space-x-2">
                  {r.locked ? (
                    <span className="text-gray-400 text-sm">🔒 Đã khóa</span>
                  ) : (
                    <>
                      <Button onClick={() => handleSave(r.examResultId, r.score ?? 0)}>
                        Lưu
                      </Button>
                      {r.status === "PASS" && (
                        <Button variant="outline" onClick={() => handleRenderOne(r)}>
                          🎓 Tạo chứng chỉ
                        </Button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Danh sách chứng chỉ render */}
      {renderedList.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border rounded">
          <h3 className="font-semibold mb-3">📄 Danh sách chứng chỉ đã render:</h3>

          {renderedList.map((c, i) => {
            const pdfBlob = c.pdf?.base64
              ? URL.createObjectURL(
                  new Blob(
                    [Uint8Array.from(atob(c.pdf.base64), (ch) => ch.charCodeAt(0))],
                    { type: "application/pdf" }
                  )
                )
              : null;

            const aiMatch = aiResults.find(
              (r) =>
                r.certId === c.preIssueHash ||
                r.certId === String(c.metadata?.examResultId)
            );

            return (
              <div
                key={i}
                className={`border rounded p-3 bg-white mb-2 ${
                  aiMatch
                    ? aiMatch.status === "unique"
                      ? "border-green-400 bg-green-50"
                      : "border-yellow-400 bg-yellow-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{i + 1}. {c.name}</p>
                    <code className="text-sm text-blue-600">
                      {c.preIssueHash?.slice(0, 16)}...
                    </code>
                    {aiMatch && (
                      <p className="text-sm mt-1">
                        🧠 Kết quả AI: <b>{aiMatch.status}</b> (
                        {Math.round(aiMatch.similarityScore * 100)}%)
                      </p>
                    )}
                  </div>
                  {pdfBlob ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.open(pdfBlob, "_blank")}>
                        👁️ Xem
                      </Button>
                      <a
                        href={pdfBlob}
                        download={`${c.name}_certificate.pdf`}
                        className="px-3 py-2 border rounded text-sm text-blue-600 hover:bg-blue-50"
                      >
                        ⬇️ Tải
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Không có PDF</span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-3 mt-5">
            <Button onClick={handleDownloadAll} className="bg-green-600 hover:bg-green-700 text-white">
              ⬇️ Tải xuống tất cả
            </Button>
            <Button variant="outline" onClick={handleAICheck}>
              🤖 Kiểm tra trùng lặp (AI)
            </Button>
          </div>

          {aiChecked &&
            aiResults.length > 0 &&
            aiResults.every((r) => r.status === "unique") && (
              <div className="text-center mt-5">
                <Button
                  onClick={() =>
                    alert("🚀 Triển khai Smart Contract cấp chứng chỉ NFT!")
                  }
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  ✅ Cấp chứng chỉ NFT
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
