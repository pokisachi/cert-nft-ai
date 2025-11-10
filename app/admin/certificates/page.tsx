"use client";
import React from "react";
import { useDedupCheck } from "./hooks/useDedupCheck";

export default function CertificatesPage() {
  const { loading, results, error, checkCertificates } = useDedupCheck();

  const handleAI = async () => {
    // 🧾 Ví dụ dữ liệu — thay bằng danh sách PDF thật sau
    const items = [
      {
        certId: "CERT-001",
        pdfBase64: "JVBERi0xLjQKJ...", // Base64 file PDF
        studentName: "Filip Tenil",
        dob: "2009-09-20",
        course: "TOEIC 450+",
      },
      {
        certId: "CERT-002",
        pdfBase64: "JVBERi0xLjQKJ...",
        studentName: "Nguyen Van B",
        dob: "2010-02-15",
        course: "TOEIC 450+",
      },
    ];

    await checkCertificates(items);
  };

  const handleMintNFT = () => {
    alert("🚀 Triển khai Smart Contract cấp chứng chỉ NFT cho tất cả học viên hợp lệ!");
    // TODO: Tích hợp Web3 hoặc contract sau
  };

  const allUnique = results?.length && results.every(r => r.status === "unique");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🧠 Kiểm tra trùng lặp chứng chỉ (AI)</h2>

        <button
          onClick={handleAI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Đang kiểm tra..." : "Kiểm tra trùng lặp (AI)"}
        </button>
      </div>

      {/* 🪲 Hiển thị lỗi */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-400 text-red-700 rounded">
          ❌ Lỗi: {error}
        </div>
      )}

      {/* 📊 Kết quả */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Kết quả kiểm tra:</h3>

          {results.map((r) => (
            <div
              key={r.certId}
              className={`border rounded p-4 transition ${
                r.status === "unique"
                  ? "bg-green-50 border-green-400 text-green-800"
                  : r.status === "duplicate"
                  ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                  : "bg-red-50 border-red-400 text-red-800"
              }`}
            >
              <p className="font-medium">🎓 {r.certId}</p>
              <p>
                Trạng thái: <b>{r.status}</b>
              </p>
              <p>Điểm tương đồng: {r.similarityScore}</p>

              {r.matchedWith?.length > 0 && (
                <p className="text-sm mt-2">
                  🔗 Trùng với:{" "}
                  {r.matchedWith.map((m) => (
                    <span key={m.refDocHash} className="italic mr-2">
                      {m.refDocHash} ({Math.round(m.score * 100)}%)
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}

          {/* Nếu tất cả là unique thì hiển thị nút cấp NFT */}
          {allUnique && (
            <div className="text-center pt-4">
              <button
                onClick={handleMintNFT}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                ✅ Cấp chứng chỉ NFT cho tất cả học viên
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && (!results || results.length === 0) && (
        <p className="text-gray-500">Chưa có kết quả nào — hãy nhấn "Kiểm tra trùng lặp (AI)"</p>
      )}

      {/* 👀 Debug hiển thị thô JSON nếu cần */}
      {results && (
        <pre className="bg-gray-100 p-4 rounded text-xs text-gray-700 overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
}
