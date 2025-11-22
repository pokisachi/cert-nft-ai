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
  id: number;
  examResultId: number;
  userId: number;
  courseId: number;
  preIssueHash: string;
  status: "unique" | "duplicate" | "suspected_copy";
  similarityScore: number;
  checkedAt: string;
  certId?: string;
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
    // 🔹 Load AI Dedup từ DB — lấy theo userId + courseId
        const fetchAIDedupFromDB = async () => {
          try {
            const res = await fetch(`/api/internal/ai/by-session/${sessionId}`);
            const json = await res.json();

            if (!res.ok) {
              toast.error(json.error || "Không thể tải AI Dedup từ DB");
              return;
            }

            setAIResults(json.results || []);
            toast.success("🔄 Đã tải lại AI Dedup từ DB");
          } catch (e) {
            console.error("FETCH AI DB ERROR:", e);
            toast.error("Lỗi tải AI Dedup từ DB");
          }
        };


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
      // Create mapping of certId to database identifiers for later use
      const certIdToDbIds: Record<string, { examResultId: number; userId: number; courseId: number }> = {};
      
      const items = renderedList.map((c) => {
        const certId = String(c.preIssueHash || c.metadata?.examResultId || `cert-${Math.random()}`);
        
        // Store mapping for later use
        certIdToDbIds[certId] = {
          examResultId: c.metadata?.examResultId,
          userId: c.metadata?.userId,
          courseId: c.metadata?.courseId,
        };
        
        return {
          certId,
          studentName: c.name || "UNKNOWN",
          dob: "",
          course: c.metadata?.profile || "UNKNOWN",
          pdfBase64: c.pdf?.base64?.trim() || "",
          examResultId: c.metadata?.examResultId,
          userId: c.metadata?.userId,
          courseId: c.metadata?.courseId,
        };
      });

      const validItems = items.filter((i) => i.pdfBase64.length > 0);
      if (!validItems.length)
        return toast.error("Không có PDF hợp lệ để gửi lên AI.");

      const res = await fetch(
        "/api/admin/certificates/ai-dedup-check",
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

      // Save AI results to DB
      const savePromises = data.results.map(async (result: any) => {
        // Get the original database identifiers using the certId
        const dbIds = certIdToDbIds[result.certId];
        
        // Validate that we have the required database identifiers
        if (!dbIds || !dbIds.examResultId || !dbIds.userId || !dbIds.courseId) {
          console.error("Missing database identifiers for certId:", result.certId);
          return Promise.resolve({ error: "Missing database identifiers" });
        }
        
        const saveRes = await fetch("/api/internal/ai/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examResultId: dbIds.examResultId,
            userId: dbIds.userId,
            courseId: dbIds.courseId,
            similarityScore: result.similarityScore,
            preIssueHash: result.docHash, // Use docHash as preIssueHash
            status: result.status,
          }),
        });
        return saveRes.json();
      });

      await Promise.all(savePromises);

      const results = Array.isArray(data.results) ? data.results : [];
      await fetchAIDedupFromDB();
      setAIChecked(true);
      const uniqueCount = results.filter((r: any) => r.status === "unique").length;
      const dupCount = results.filter((r: any) => r.status === "duplicate").length;
      const suspectCount = results.filter((r: any) => r.status === "suspected_copy").length;
      toast.success(`✅ AI xử lý ${results.length} chứng chỉ (Unique: ${uniqueCount}, Duplicate: ${dupCount}, Suspected: ${suspectCount})`);
      if (dupCount > 0 || suspectCount > 0) {
        toast.warning("⚠️ Có chứng chỉ nghi trùng hoặc trùng lặp. Vui lòng kiểm tra.");
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
        {aiResults.length > 0 && aiResults.every((r) => r.status === "unique") ? (
          <Button
            onClick={async () => {
              try {
                toast.info("🚀 Đang cấp tất cả (batch)...");
                const r = await fetch("/api/certificates/issue-batch", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId }),
                });
                const data = await r.json();
                if (!r.ok) {
                  return toast.error(`❌ Batch thất bại: ${data?.error || "Lỗi"}`);
                }
                const ok = (data.minted || []).length;
                const fail = (data.skipped || []).length;
                toast.success(`🎉 Batch: thành công ${ok}, thất bại ${fail}`);
              } catch (e) {
                console.error(e);
                toast.error("❌ Batch cấp chứng chỉ lỗi.");
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            ✅ Cấp tất cả (batch)
          </Button>
        ) : null}
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
                      {r.status === "PASS" && (() => {
                        const aiRow = aiResults.find(
                          (a) => a.userId === r.user.id && a.courseId === sessionInfo?.course?.id
                        );
                        return aiRow && aiRow.status === "unique" ? (
                          <Button
                            className="bg-purple-600 text-white hover:bg-purple-700"
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/certificates/issue-final", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    examResultId: r.examResultId,
                                    issue_date: new Date().toISOString().split("T")[0],
                                    certificate_code: `BF-${new Date().getFullYear()}-${r.examResultId}`,
                                    issuer_name: "UNET.edu.vn",
                                    preIssueHash: aiRow.preIssueHash,
                                  }),
                                });
                                const payload = await res.json();
                                if (!res.ok) {
                                  return toast.error(`❌ ${r.user.name}: thất bại (${payload?.error || "Lỗi"})`);
                                }
                                toast.success(`✅ ${r.user.name}: cấp thành công (#${payload.tokenId})`);
                              } catch (err) {
                                console.error(err);
                                toast.error("❌ Cấp chứng chỉ thất bại.");
                              }
                            }}
                          >
                            ✅ Cấp ngay
                          </Button>
                        ) : null;
                      })()}
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
                r.userId === c.metadata?.userId &&
                r.courseId === c.metadata?.courseId
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
                        {aiMatch ? (
                          <p className="text-sm mt-1">
                            🧠 Kết quả AI (DB):
                            <b>{aiMatch.status}</b> – 
                            {Math.round((aiMatch.similarityScore ?? 0) * 100)}%
                          </p>
                        ) : (
                          <p className="text-sm mt-1 text-gray-500">
                            (Chưa có kết quả AI trong DB)
                          </p>
                        )}


                  </div>
                  {pdfBlob ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.open(pdfBlob, "_blank")}>
                        👁️ Xem
                      </Button>
                      {aiMatch && aiMatch.status === "unique" ? (
                        <Button
                          className="bg-purple-600 text-white hover:bg-purple-700"
                          onClick={async () => {
                            try {
                              const name = rows.find((r) => r.examResultId === c.metadata?.examResultId)?.user.name || "UNKNOWN";
                              toast.info(`⛓️ Đang cấp chứng chỉ cho ${name}...`);
                              const res = await fetch("/api/certificates/issue-final", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  examResultId: c.metadata?.examResultId,
                                  issue_date: new Date().toISOString().split("T")[0],
                                  certificate_code: `BF-${new Date().getFullYear()}-${c.metadata?.examResultId}`,
                                  issuer_name: "UNET.edu.vn",
                                  preIssueHash: c.preIssueHash,
                                }),
                              });
                              const payload = await res.json();
                              if (!res.ok) {
                                toast.error(`❌ ${name}: thất bại (${payload?.error || "Lỗi"})`);
                              } else {
                                toast.success(`✅ ${name}: cấp thành công (#${payload.tokenId})`);
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("❌ Cấp chứng chỉ thất bại.");
                            }
                          }}
                        >
                          ✅ Cấp
                        </Button>
                      ) : null}
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

          {aiResults.length > 0 &&
aiResults.every((r) => r.status === "unique")
 && (
              <div className="text-center mt-5">
                
    <Button
      onClick={async () => {
        try {
          toast.info("⛓️ Đang cấp chứng chỉ cho tất cả...");
          const minted: Array<{ name: string; tokenId: string }> = [];
          const failed: Array<{ name: string; reason: string }> = [];
          for (const c of renderedList) {
            const name = rows.find((r) => r.examResultId === c.metadata?.examResultId)?.user.name || "UNKNOWN";
            const res = await fetch("/api/certificates/issue-final", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                examResultId: c.metadata?.examResultId,
                issue_date: new Date().toISOString().split("T")[0],
                certificate_code: `BF-${new Date().getFullYear()}-${c.metadata?.examResultId}`,
                issuer_name: "UNET.edu.vn",
                preIssueHash: c.preIssueHash,
              }),
            });
            const payload = await res.json();
            if (res.ok) {
              minted.push({ name, tokenId: payload.tokenId });
              toast.success(`✅ ${name}: cấp thành công (#${payload.tokenId})`);
            } else {
              failed.push({ name, reason: payload?.error || "ISSUE_FINAL_FAILED" });
              toast.error(`❌ ${name}: thất bại (${payload?.error || "Lỗi"})`);
            }
          }
          toast.success(`🎉 Tổng kết: thành công ${minted.length}, thất bại ${failed.length}`);
        } catch (err) {
          console.error(err);
          toast.error("❌ Cấp chứng chỉ thất bại.");
        }
      }}
      className="bg-purple-600 text-white hover:bg-purple-700"
    >
      ✅ Cấp chứng chỉ NFT (tất cả)
    </Button>

              </div>
            )}
        </div>
      )}
    </div>
  );
}
