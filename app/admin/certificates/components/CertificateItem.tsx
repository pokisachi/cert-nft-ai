import CertificateCheck from './CertificateCheck';

interface Props {
  certId: string;
  studentName: string;
  dob: string;
  course: string;
  pdfBase64: string;
}

export default function CertificateItem(props: Props) {
  const { certId, studentName, dob, course } = props;

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      <h3 className="font-semibold text-gray-800">
        {studentName} — {course}
      </h3>
      <p className="text-sm text-gray-500">Ngày sinh: {dob}</p>
      <CertificateCheck {...props} />
    </div>
  );
}
