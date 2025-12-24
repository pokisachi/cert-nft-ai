"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { User, BookOpen, Link as LinkIcon, Hash, Mail, Calendar, CheckCircle2, ExternalLink, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
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

  const truncateMiddle = (value: string | null | undefined) => {
    const s = value || "";
    if (!s) return "—";
    if (s.length <= 12) return s;
    return `${s.slice(0, 6)}...${s.slice(-4)}`;
  };

  const copy = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Đã copy");
    });
  };
  const shareCertificate = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = data ? `Chứng chỉ #${data.tokenId}` : "Chứng chỉ";
    const navAny = navigator as any;
    if (navAny && typeof navAny.share === "function") {
      navAny.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Đã copy"));
    }
  };

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

  

  if (!data) return <p className="p-6 bg-gray-50 text-gray-900">Đang tải...</p>;

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
    <div className="min-h-screen bg-gray-50 text-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">

        <div className="space-y-3">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Link href="/" className="hover:text-gray-700">Trang chủ</Link>
            <span>›</span>
            <Link href="/cert" className="hover:text-gray-700">Chứng chỉ</Link>
            <span>›</span>
            <span>{data.course.title || data.student.name || "Chi tiết"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{data.course.title || data.student.name || `Chứng chỉ #${data.tokenId}`}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium">Token: #{data.tokenId}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium">ERC-721</span>
            <span className={`px-2.5 py-1 rounded-full text-xs border font-medium inline-flex items-center gap-1 ${data.revoked ? "bg-red-100 text-red-700 border-red-200" : (onchainStatus === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200")}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {data.revoked ? "Revoked" : onchainStatus === "ACTIVE" ? "Verified" : "Burned"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" /> {issueDate}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[520px,1fr] gap-8 items-start">

          {/* ============================
              LEFT SIDE — Certificate Preview
          ============================= */}
          <div className="md:sticky md:top-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div
                id="certificate-content"
                className="relative w-full aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-white border border-gray-200"
                style={{ backgroundImage: "url(/cert-bg.png)", backgroundSize: "cover", backgroundPosition: "center" }}
              >
                <div className="absolute inset-0 flex flex-col justify-center items-center p-10 text-center">
                  <p className="text-xs text-amber-600 tracking-[0.25em] uppercase">Certificate of Completion</p>
                  <p className="mt-3 text-sm text-gray-600">Trao cho</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{data.student.name}</p>
                  <p className="mt-4 text-xs text-gray-600">Đã hoàn thành khóa học</p>
                  <p className="text-sm font-medium text-gray-800">{data.course.title}</p>
                  <div className="absolute bottom-6 w-full px-8 flex justify-between text-[10px] text-gray-600">
                    <div>
                      <p>Mã chứng chỉ</p>
                      <p className="font-bold text-gray-800">#{data.tokenId}</p>
                    </div>
                    <div className="text-right">
                      <p>Blockchain</p>
                      <p className="font-bold text-gray-800">Chain {data.blockchain.chainId}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={downloadCertificate}
                  disabled={data.revoked}
                  aria-label="Tải PDF"
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium ${data.revoked ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"} shadow-md hover:shadow-lg active:scale-95 transition`}
                >
                  <Download className="h-5 w-5" />
                  Tải PDF
                </button>
                <button
                  onClick={shareCertificate}
                  aria-label="Chia sẻ"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-3 border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================
              RIGHT SIDE — Details
          ============================= */}
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-2xl border border-gray-200">
              <div className="text-gray-900 font-semibold mb-2">Chi tiết</div>

              <div className="divide-y divide-gray-200">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><User className="h-4 w-4" />Học viên</div>
                  <div className="flex items-center gap-2 text-gray-900">{data.student.name || "—"}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><Mail className="h-4 w-4" />Email</div>
                  <div className="flex items-center gap-2 text-gray-900 break-all">{data.student.email}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><Calendar className="h-4 w-4" />Ngày cấp</div>
                  <div className="flex items-center gap-2 text-gray-900">{issueDate}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><BookOpen className="h-4 w-4" />Khóa học</div>
                  <div className="flex items-center gap-2 text-gray-900">{data.course.title}</div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><CheckCircle2 className="h-4 w-4 text-green-600" />Trạng thái On-chain</div>
                  <div className="flex items-center gap-2">
                    <span className={`${data.revoked ? "bg-red-100 text-red-700 border border-red-200" : (onchainStatus === "ACTIVE" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-700 border border-gray-200")} inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {data.revoked ? "Revoked" : onchainStatus === "ACTIVE" ? "Verified" : "Burned"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><User className="h-4 w-4" />Owner</div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-mono">{truncateMiddle(onchainOwner)}</span>
                    {onchainOwner && (
                      <button aria-label="Copy owner" onClick={() => copy(onchainOwner)} className="text-indigo-600 hover:text-indigo-700"><Copy className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><LinkIcon className="h-4 w-4" />Contract Address</div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-mono">{truncateMiddle(data.blockchain.contract)}</span>
                    {data.blockchain.contract && (
                      <button aria-label="Copy contract" onClick={() => copy(data.blockchain.contract)} className="text-indigo-600 hover:text-indigo-700"><Copy className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><Hash className="h-4 w-4" />TxHash</div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-mono">{truncateMiddle(data.blockchain.txHash)}</span>
                    {data.blockchain.txHash && (
                      <button aria-label="Copy txhash" onClick={() => copy(data.blockchain.txHash!)} className="text-indigo-600 hover:text-indigo-700"><Copy className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><Hash className="h-4 w-4" />Token ID</div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-mono">{data.tokenId}</span>
                    <button aria-label="Copy token id" onClick={() => copy(String(data.tokenId))} className="text-indigo-600 hover:text-indigo-700"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><LinkIcon className="h-4 w-4" />Explorer</div>
                  <div className="flex items-center gap-2">
                    {scanUrl ? (
                      <a href={scanUrl} target="_blank" className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                        Xem trên VicScan
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><LinkIcon className="h-4 w-4" />Classification</div>
                  <div className="flex items-center gap-2 text-gray-900">Off-Chain (IPFS)</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-500"><LinkIcon className="h-4 w-4" />Token Standard</div>
                  <div className="flex items-center gap-2 text-gray-900">ERC-721</div>
                </div>
              </div>
            </section>

            {data.revoked && (
              <section className="bg-red-50 p-5 rounded-2xl border border-red-200">
                <p className="text-sm text-red-700">Chứng chỉ này đã bị thu hồi. Nội dung PDF/in ấn bị vô hiệu để tránh sử dụng sai mục đích. Chủ sở hữu vẫn có thể xem lịch sử giao dịch on-chain.</p>
                {data.revocation?.txHash && (
                  <p className="mt-2 text-xs text-gray-700">
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
