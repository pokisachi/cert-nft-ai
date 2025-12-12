'use client';
import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';

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
  const [score, setScore] = useState<number | null>(null);

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
        const similarity = data.results?.[0]?.similarityScore ?? null;
        setResult(status);
        setMatched(matches);
        setScore(typeof similarity === 'number' ? similarity : null);

        if (status === 'unique') {
          toast.success('✅ Kiểm tra trùng lặp: Không trùng lặp');
        } else if (status === 'duplicate') {
          const label = matches && Array.isArray(matches) && matches.length > 0 ? matches.join(', ') : 'Không rõ';
          toast.warning(`⚠️ Kiểm tra trùng lặp: Có trùng lặp với ${label}`);
        } else if (status === 'suspected_copy') {
          toast.warning('⚠️ Kiểm tra trùng lặp: Nghi sao chép');
        } else {
          toast.error('❌ Kiểm tra trùng lặp thất bại');
        }
      } else {
        setResult('error');
        toast.error('❌ Kiểm tra trùng lặp thất bại');
      }
    } catch (err) {
      console.error(err);
      setResult('error');
      toast.error('❌ Không thể kết nối dịch vụ AI');
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

      {result && (
        <div className="p-4 border rounded bg-white text-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                  ${result === 'unique' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    result === 'duplicate' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    result === 'suspected_copy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'}`}
              >
                {result === 'unique' && <CheckCircle2 className="h-3 w-3" />}
                {result === 'duplicate' && <Copy className="h-3 w-3" />}
                {result === 'suspected_copy' && <AlertTriangle className="h-3 w-3" />}
                {result === 'unique' ? 'Không trùng lặp' : result === 'duplicate' ? 'Trùng lặp' : result === 'suspected_copy' ? 'Nghi sao chép' : 'Lỗi'}
              </span>
              {score !== null && (
                <span className="text-xs text-slate-700">
                  Độ tương đồng: {Math.min(100, Math.max(0, Math.round(score * 100)))}%
                </span>
              )}
            </div>
            {result === 'unique' && (
              <button
                onClick={handleMintNFT}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
              >
                Cấp chứng chỉ NFT
              </button>
            )}
          </div>
          {score !== null && (
            <div className="mt-2 h-2 w-full rounded bg-slate-200">
              <div
                className={`h-2 rounded ${result === 'unique' ? 'bg-emerald-500' : result === 'duplicate' ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, Math.round(score * 100)))}%` }}
              />
            </div>
          )}
          {result === 'duplicate' && (
            <div className="mt-2 text-xs text-slate-700">
              Trùng lặp với: {matched.join(', ') || 'Không rõ'}
            </div>
          )}
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
