"use client";

import { useEffect, useState } from "react";

type CertDetailData = {
  tokenId: string;
  issuedAt: string;
  student: {
    name: string | null;
  };
  course: {
    title: string;
  };
  blockchain: {
    chainId: number;
  };
};

export default function CertPrintPage({
  params,
}: {
  params: { tokenId: string };
}) {
  const { tokenId } = params;
  const [data, setData] = useState<CertDetailData | null>(null);

  useEffect(() => {
    fetch(`/api/certificates/${tokenId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch(console.error);
  }, [tokenId]);

  // Khi đã có dữ liệu → tự động bật hộp thoại in (nếu bạn thích)
  useEffect(() => {
    if (data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [data]);

  if (!data) return <p className="p-6">Đang chuẩn bị bản in...</p>;

  const issueDate = new Date(data.issuedAt).toLocaleDateString("vi-VN");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10">
      <div
        className="relative w-[800px] aspect-[3/4] shadow-xl border border-slate-300 overflow-hidden bg-white"
        style={{
          backgroundImage: "url(/cert-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Nội dung giống thumbnail nhưng rộng hơn */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-14 text-center">
          <p className="text-xs text-amber-600 tracking-[0.25em] uppercase">
            Certificate of Completion
          </p>

          <p className="mt-4 text-sm text-slate-600">Trao cho</p>

          <p className="text-2xl font-bold text-slate-900 mt-2">
            {data.student.name}
          </p>

          <p className="mt-6 text-xs text-slate-600">
            Đã hoàn thành khóa học / Completed Course
          </p>

          <p className="text-base font-semibold text-slate-800 mt-1">
            {data.course.title}
          </p>

          <p className="mt-6 text-xs text-slate-500">
            Ngày cấp / Issued on: {issueDate}
          </p>

          {/* Footer */}
          <div className="absolute bottom-8 w-full px-12 flex justify-between text-[10px] text-slate-600">
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
    </div>
  );
}
