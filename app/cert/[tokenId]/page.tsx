"use client";

import { use, useEffect, useState } from "react";

type CertDetailData = {
  tokenId: string;
  issuedAt: string;
  student: {
    name: string | null;
    email: string;
    dob: string | null;
  };
  course: {
    title: string;
    category: string;
  };
  blockchain: {
    chainId: number;
    contract: string;
    txHash: string | null;
  };
  files: {
    pdf: string;
    metadata?: string | null;
  };
};

export default function CertDetailPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const [data, setData] = useState<CertDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/${tokenId}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Không lấy được dữ liệu chứng chỉ");
        }
        if (!cancelled) {
          setData(json.data as CertDetailData);
          setError(null);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e.message || "Lỗi không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  if (loading) return <p className="p-6">Đang tải chứng chỉ...</p>;
  if (error) return <p className="p-6 text-red-600">Lỗi: {error}</p>;
  if (!data) return <p className="p-6">Không tìm thấy chứng chỉ.</p>;

  const issueDate = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("vi-VN")
    : "";

  const dob = data.student.dob
    ? new Date(data.student.dob).toLocaleDateString("vi-VN")
    : "—";

  // Hàm mở PDF trong tab mới (do Pinata chặn nhúng iframe)
  const openPdf = () => {
    if (data.files.pdf) {
      window.open(data.files.pdf, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">
            🎓 Chứng chỉ #{data.tokenId}
          </h1>
          <span className="text-sm text-slate-500">
            Ngày cấp: {issueDate || "—"}
          </span>
        </div>

        <div className="grid md:grid-cols-[2fr,3fr] gap-6 items-start">
          {/* Cột trái: Thumbnail certificate */}
          <div className="flex flex-col gap-4">
            <div
              className="relative w-full aspect-[3/4] rounded-xl shadow-lg overflow-hidden border border-slate-200 bg-center bg-cover"
              style={{ backgroundImage: "url(/cert-bg.png)" }}
            >
              {/* Overlay nội dung chứng chỉ */}
              <div className="absolute inset-0 flex flex-col px-8 py-10">
                <div className="flex-1 flex flex-col justify-center items-center text-center gap-3">
                  <p className="text-xs tracking-[0.25em] uppercase text-amber-600">
                    Certificate of Completion
                  </p>
                  <p className="text-sm text-slate-500">Trao cho</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.student.name || "Tên học viên"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Đã hoàn thành khóa học
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {data.course.title}
                  </p>
                </div>

                <div className="flex justify-between items-end text-[10px] text-slate-500 mt-4">
                  <div>
                    <p>Mã chứng chỉ</p>
                    <p className="font-semibold text-slate-800">
                      #{data.tokenId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>Blockchain</p>
                    <p className="font-semibold text-slate-800">
                      Chain {data.blockchain.chainId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút mở PDF */}
            <button
              onClick={openPdf}
              className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              📄 Xem PDF gốc (Pinata)
            </button>
          </div>

          {/* Cột phải: Thông tin chi tiết */}
          <div className="space-y-4">
            {/* Học viên */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>👤 Học viên</span>
              </h2>
              <p className="font-medium">{data.student.name}</p>
              <p className="text-sm text-slate-600">{data.student.email}</p>
              <p className="text-sm text-slate-600">Ngày sinh: {dob}</p>
            </section>

            {/* Khóa học */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>📘 Khóa học</span>
              </h2>
              <p className="font-medium">{data.course.title}</p>
              <p className="text-sm text-slate-600">
                Chuyên mục: {data.course.category}
              </p>
            </section>

            {/* Blockchain */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>⛓️ Blockchain</span>
              </h2>
              <p className="text-sm text-slate-700">
                <span className="font-medium">Chain ID:</span>{" "}
                {data.blockchain.chainId}
              </p>
              <p className="text-sm text-slate-700 break-all">
                <span className="font-medium">Contract:</span>{" "}
                {data.blockchain.contract}
              </p>
              <p className="text-sm text-slate-700 break-all">
                <span className="font-medium">TxHash:</span>{" "}
                {data.blockchain.txHash || "—"}
              </p>
            </section>

            {/* File */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>📎 Tập tin</span>
              </h2>

              <div className="space-y-2 text-sm">
                <a
                  href={data.files.pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1"
                >
                  📄 Xem PDF
                </a>

                {data.files.metadata && (
                  <a
                    href={data.files.metadata}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    🗂️ Metadata.json
                  </a>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                * Pinata không cho phép nhúng trực tiếp PDF vào iframe, nên bạn
                sẽ được mở file trong tab mới.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
