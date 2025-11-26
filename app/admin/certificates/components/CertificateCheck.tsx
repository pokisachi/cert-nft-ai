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
  const [metrics, setMetrics] = useState<null | {
    f1_score: number;
    precision: number;
    recall: number;
    accuracy: number;
    confusion_matrix: { TP: number; FP: number; FN: number; TN: number };
  }>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);

  const handleCheckDuplicate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8001/api/admin/certificates/ai-dedup-check', {
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

        try {
          const evalRes = await fetch('http://localhost:8001/api/evaluate/dedup', { method: 'POST' });
          const evalData = await evalRes.json().catch(() => ({}));
          if (evalRes.ok && evalData?.evaluation_metrics) {
            setMetrics(evalData.evaluation_metrics);
            const url = evalData?.heatmap_url || null;
            setHeatmapUrl(url ? (String(url).startsWith('http') ? url : `http://localhost:8001${url}`) : null);
          } else {
            setMetrics(null);
            setHeatmapUrl(null);
          }
        } catch {
          setMetrics(null);
          setHeatmapUrl(null);
        }
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

      {metrics && (
        <div className="p-3 border rounded bg-slate-50 text-slate-800">
          <p className="font-medium">Đánh giá thuật toán (mô phỏng)</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>Điểm F1: <b>{metrics.f1_score}%</b></div>
            <div>Độ chính xác (Precision): <b>{metrics.precision}%</b></div>
            <div>Độ bao phủ (Recall): <b>{metrics.recall}%</b></div>
            <div>Độ đúng (Accuracy): <b>{metrics.accuracy}%</b></div>
          </div>
          <div className="mt-2 text-sm">
            Ma trận nhầm lẫn — Đúng trùng (TP): {metrics.confusion_matrix.TP}, Báo trùng nhầm (FP): {metrics.confusion_matrix.FP}, Bỏ sót trùng (FN): {metrics.confusion_matrix.FN}, Đúng không trùng (TN): {metrics.confusion_matrix.TN}
          </div>
          {heatmapUrl && (
            <div className="mt-3">
              <img src={heatmapUrl} alt="Ma trận nhầm lẫn" className="max-w-full h-auto border rounded" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
