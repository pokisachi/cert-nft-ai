'use client';
import { useState } from 'react';

interface CertificateCheckProps {
  certId: string;
  studentName: string;
  dob: string;
  course: string;
  pdfBase64: string;
}

export default function CertificateCheck({
  certId,
  studentName,
  dob,
  course,
  pdfBase64,
}: CertificateCheckProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);

  const handleCheckDuplicate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/admin/certificates/ai-dedup-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              certId,
              pdfBase64,
              metadata: {
                studentName,
                dob,
                course,
                source: 'frontend',
              },
            },
          ],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const status = data.results?.[0]?.status || 'error';
        const matches = data.results?.[0]?.matchedWith || [];
        setResult(status);
        setMatched(matches);
      } else {
        setResult('error');
      }
    } catch (err) {
      console.error(err);
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = () => {
    alert(`🚀 Triển khai Smart Contract cấp chứng chỉ NFT cho ${studentName}`);
    // TODO: tích hợp smart contract (ví dụ dùng ethers.js hoặc web3)
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
      <h3 className="font-semibold text-gray-800">Kiểm tra trùng lặp AI</h3>

      {!result && (
        <button
          onClick={handleCheckDuplicate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang kiểm tra...' : 'Kiểm tra trùng lặp (AI)'}
        </button>
      )}

      {result === 'unique' && (
        <div className="p-3 border rounded bg-green-50 text-green-800">
          ✅ Chứng chỉ hợp lệ, không trùng lặp!
          <div className="mt-3">
            <button
              onClick={handleMintNFT}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Cấp chứng chỉ NFT
            </button>
          </div>
        </div>
      )}

      {result === 'duplicate' && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-800">
          ⚠️ Phát hiện trùng lặp với chứng chỉ: {matched.join(', ') || 'Không rõ'}
        </div>
      )}

      {result === 'error' && (
        <div className="p-3 border rounded bg-red-50 text-red-800">
          ❌ Lỗi khi kiểm tra. Vui lòng thử lại.
        </div>
      )}
    </div>
  );
}
