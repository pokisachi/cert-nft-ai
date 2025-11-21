"use client";

import { use, useEffect, useState } from "react";

type CertDetailData = {
  tokenId: string;
  issuedAt: string;
  student: {
    name: string | null;
    email: string;
    dob: string | null;
    walletAddress: string | null;
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
};

export default function CertDetailPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const [data, setData] = useState<CertDetailData | null>(null);

  useEffect(() => {
    fetch(`/api/certificates/${tokenId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data));
  }, [tokenId]);

  if (!data) return <p className="p-6">Đang tải...</p>;

  const issueDate = new Date(data.issuedAt).toLocaleDateString("vi-VN");
  const dob = data.student.dob
    ? new Date(data.student.dob).toLocaleDateString("vi-VN")
    : "—";

  // ===========================
  // 🔥 Function: Export certificate section as PDF
  // ===========================
const downloadCertificate = () => {
  const content = document.getElementById("certificate-content");
  if (!content) return;

  const html = `
    <html>
      <head>
        <title>Certificate</title>
        <meta charset="UTF-8" />

        <!-- Embed Tailwind from CDN -->
        <script src="https://cdn.tailwindcss.com"></script>

        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body class="flex justify-center items-center p-0 m-0">
        <div style="width: 794px; height: 1123px;">
          ${content.innerHTML}
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 800);
};



  const scanUrl = data.blockchain.txHash
    ? `https://testnet.vicscan.xyz/tx/${data.blockchain.txHash}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">🎓 Chứng chỉ #{data.tokenId}</h1>
          <p className="text-sm text-slate-500">Ngày cấp: {issueDate}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-10">

          {/* ============================
              LEFT SIDE — Certificate Preview
          ============================= */}
          <div className="flex flex-col gap-4">
            
            {/* Certificate Thumbnail */}
            <div
              id="certificate-content"
              className="
                relative w-full aspect-[3/4] rounded-xl shadow-lg overflow-hidden 
                bg-white border border-slate-300
              "
              style={{
                backgroundImage: "url(/cert-bg.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-center items-center p-10 text-center">

                <p className="text-xs text-amber-600 tracking-[0.25em] uppercase">
                  Certificate of Completion
                </p>

                <p className="mt-3 text-sm text-slate-600">Trao cho</p>

                <p className="text-xl font-bold text-slate-900 mt-1">
                  {data.student.name}
                </p>

                <p className="mt-4 text-xs text-slate-600">
                  Đã hoàn thành khóa học
                </p>

                <p className="text-sm font-medium text-slate-800">
                  {data.course.title}
                </p>

                {/* Footer */}
                <div className="absolute bottom-6 w-full px-8 flex justify-between text-[10px] text-slate-600">
                  <div>
                    <p>Mã chứng chỉ</p>
                    <p className="font-bold text-slate-800">#{data.tokenId}</p>
                  </div>

                  <div className="text-right">
                    <p>Blockchain</p>
                    <p className="font-bold text-slate-800">
                      Chain {data.blockchain.chainId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={downloadCertificate}
              className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              📄 Tải chứng chỉ (PDF)
            </button>

            <button
              onClick={downloadCertificate}
              className="w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800"
            >
              🖨️ In chứng chỉ
            </button>

            {scanUrl && (
              <a
                href={scanUrl}
                target="_blank"
                className="w-full py-2 px-4 text-center rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                🔍 Kiểm tra On-chain
              </a>
            )}
          </div>

          {/* ============================
              RIGHT SIDE — Details
          ============================= */}
          <div className="space-y-6">

            {/* Student Info */}
            <section className="bg-white p-5 rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold mb-3">👤 Học viên</h2>
              <p><b>Họ tên:</b> {data.student.name}</p>
              <p><b>Email:</b> {data.student.email}</p>
              <p><b>Ngày sinh:</b> {dob}</p>
              <p><b>Chủ sở hữu chứng chỉ (NFT):</b> {data.student.walletAddress || "—"}</p>
            </section>

            {/* Course Info */}
            <section className="bg-white p-5 rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold mb-3">📘 Khóa học</h2>
              <p><b>Tiêu đề:</b> {data.course.title}</p>
              <p><b>Danh mục:</b> {data.course.category}</p>
            </section>

            {/* Blockchain Info */}
            <section className="bg-white p-5 rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold mb-3">⛓️ Blockchain</h2>

              <p><b>Chain ID:</b> {data.blockchain.chainId}</p>

              <p className="break-all">
                <b>Contract:</b> {data.blockchain.contract}
              </p>

              <p className="break-all">
                <b>TxHash:</b> {data.blockchain.txHash || "—"}
              </p>

              <p><b>Chủ sở hữu NFT:</b> {data.student.walletAddress || "—"}</p>

              {scanUrl && (
                <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium mb-1 text-slate-700">
                    Kiểm tra giao dịch on-chain:
                  </p>

                  <a
                    href={scanUrl}
                    target="_blank"
                    className="inline-block px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    🔗 Xem giao dịch trên VicScan
                  </a>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
