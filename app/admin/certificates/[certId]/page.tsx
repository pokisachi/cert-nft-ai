import CertificateCheck from '../components/CertificateCheck';

interface PageProps {
  params: { certId: string };
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const certId = params.certId;

  // 🔹 Giả lập dữ liệu — trong thực tế bạn sẽ fetch từ API backend
  const certificate = {
    certId,
    studentName: 'Filip Tenil',
    dob: '2009-09-20',
    course: 'TOEIC 450+',
    pdfBase64: '<base64 từ API render>',
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-semibold text-gray-800">
        Chi tiết chứng chỉ #{certId}
      </h2>

      <div className="p-4 border rounded bg-white shadow-sm">
        <p><strong>Học viên:</strong> {certificate.studentName}</p>
        <p><strong>Ngày sinh:</strong> {certificate.dob}</p>
        <p><strong>Khóa học:</strong> {certificate.course}</p>
      </div>

      {/* 🔹 Gọi component kiểm tra AI cho chứng chỉ này */}
      <CertificateCheck {...certificate} />
    </div>
  );
}
