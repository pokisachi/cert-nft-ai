"use client";

import { use, useEffect, useMemo, useState } from "react";
import { User, BookOpen, Link as LinkIcon, Hash } from "lucide-react";
import { getPublicClient } from "@/lib/onchain/viem";
import { CERT_ABI } from "@/lib/onchain/mint";

type CertDetailData = {
  tokenId: string;
  issuedAt: string;
  revoked?: boolean;
  revocation?: { txHash: string | null; at: string | null } | null;
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
  const [onchainOwner, setOnchainOwner] = useState<string | null>(null);
  const [onchainStatus, setOnchainStatus] = useState<"ACTIVE" | "BURNED" | null>(null);
  const contract = useMemo(() => (data?.blockchain?.contract || "") as `0x${string}` | "", [data]);

  useEffect(() => {
    fetch(`/api/certificates/${tokenId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data));
  }, [tokenId]);

  useEffect(() => {
    (async () => {
      if (!data?.tokenId || !contract || !contract.startsWith("0x")) return;
      try {
        const client = getPublicClient();
        const owner = await client.readContract({
          address: contract,
          abi: CERT_ABI,
          functionName: "ownerOf",
          args: [BigInt(data.tokenId)],
        });
        setOnchainOwner(owner as string);
        setOnchainStatus(owner && owner !== "0x0000000000000000000000000000000000000000" ? "ACTIVE" : "BURNED");
      } catch {
        setOnchainOwner(null);
        setOnchainStatus("BURNED");
      }
    })();
  }, [data, contract]);

  if (!data) return <p className="p-6 bg-[#111318] text-white">Đang tải...</p>;

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
    <div className="min-h-screen bg-[#111318] text-white py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* HEADER */}
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold">🎓 Chứng chỉ #{data.tokenId}</h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-[#1c1f27] border border-[#3b4354] text-white/80">Ngày cấp: {issueDate}</span>
            {data.revoked ? (
              <span className="px-3 py-1 rounded-full text-xs bg-red-900/30 text-red-300 border border-red-700/40">ĐÃ THU HỒI</span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs bg-emerald-900/30 text-emerald-300 border border-emerald-700/40">HIỆU LỰC</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[520px,1fr] gap-8 items-start">

          {/* ============================
              LEFT SIDE — Certificate Preview
          ============================= */}
          <div className="flex flex-col gap-4">
            
            {/* Certificate Thumbnail */}
            <div
              id="certificate-content"
              className="
                relative w-full aspect-[3/4] rounded-2xl shadow-xl overflow-hidden 
                bg-white border border-slate-300 mx-auto
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
              disabled={data.revoked}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${data.revoked ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              📄 Tải chứng chỉ (PDF)
            </button>

            <button
              onClick={downloadCertificate}
              disabled={data.revoked}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${data.revoked ? "bg-gray-700 cursor-not-allowed" : "bg-slate-700 hover:bg-slate-800"}`}
            >
              🖨️ In chứng chỉ
            </button>

            {scanUrl && (
              <a
                href={scanUrl}
                target="_blank"
                className={`w-full py-3 px-4 text-center rounded-md text-white font-medium ${data.revoked ? "bg-red-700 hover:bg-red-800" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {data.revoked ? "⚠️ Kiểm tra On-chain (đã thu hồi)" : "🔍 Kiểm tra On-chain"}
              </a>
            )}
          </div>

          {/* ============================
              RIGHT SIDE — Details
          ============================= */}
          <div className="space-y-6">

            {/* Student Info */}
            <section className="bg-[#1c1f27] p-5 rounded-2xl border border-[#3b4354]">
              <div className="flex items-center gap-2 mb-3"><User className="h-5 w-5" /><h2 className="text-lg font-semibold">Học viên</h2></div>
              <p><b>Họ tên:</b> {data.student.name}</p>
              <p className="break-all"><b>Email:</b> {data.student.email}</p>
              <p><b>Ngày sinh:</b> {dob}</p>
            </section>

            {/* Course Info */}
            <section className="bg-[#1c1f27] p-5 rounded-2xl border border-[#3b4354]">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="h-5 w-5" /><h2 className="text-lg font-semibold">Khóa học</h2></div>
              <p><b>Tiêu đề:</b> {data.course.title}</p>
              <p><b>Danh mục:</b> {data.course.category}</p>
            </section>

            {/* Blockchain Info */}
            <section className="bg-[#1c1f27] p-5 rounded-2xl border border-[#3b4354]">
              <div className="flex items-center gap-2 mb-3"><Hash className="h-5 w-5" /><h2 className="text-lg font-semibold">Blockchain</h2></div>

              <p><b>Chain ID:</b> {data.blockchain.chainId}</p>

              <p className="break-all font-mono text-sm">
                <b>Contract:</b> {data.blockchain.contract}
              </p>

              <p className="break-all font-mono text-sm"><b>TxHash:</b> {data.blockchain.txHash || "—"}</p>
              <p className="break-all font-mono text-sm"><b>On-chain owner:</b> {onchainOwner || "—"}</p>
              <p className="break-all font-mono text-sm"><b>On-chain status:</b> {onchainStatus || "—"}</p>


              {scanUrl && (
                <div className="mt-4 p-3 rounded-md bg-blue-900/20 border border-blue-500/40">
                  <p className="text-sm font-medium mb-1 text-blue-300">
                    {data.revoked ? "Chứng chỉ đã bị thu hồi — kiểm tra lịch sử giao dịch on-chain:" : "Kiểm tra giao dịch on-chain:"}
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
            {data.revoked && (
              <section className="bg-red-900/20 p-5 rounded-2xl border border-red-700/40">
                <p className="text-sm text-red-300">Chứng chỉ này đã bị thu hồi. Nội dung PDF/in ấn bị vô hiệu để tránh sử dụng sai mục đích. Chủ sở hữu vẫn có thể xem lịch sử giao dịch on-chain.</p>
                {data.revocation?.txHash && (
                  <p className="mt-2 text-xs text-white/70">
                    Tx thu hồi: <span className="font-mono break-all">{data.revocation.txHash}</span>{" "}
                    {data.revocation.at ? `• thời điểm: ${new Date(data.revocation.at).toLocaleString("vi-VN")}` : ""}
                  </p>
                )}
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
