export type CourseStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CLOSED';

export type CourseRow = {
  id: number;
  title: string;
  startDate?: string;
  endDate?: string;
  examDate?: string;
  status: CourseStatus;
};

export type CoursesResponse = { items: CourseRow[]; total: number };

export type CertificateItem = {
  id: number;
  courseId: number;
  courseTitle: string;
  tokenId?: string;
  ipfsCid?: string;
  status: 'VALID' | 'REVOKED';
  issuedAt: string;
  pdfUrl?: string | null;
  explorerUrl?: string | null;
};
export type CertificatesResponse = { items: CertificateItem[]; total: number };

export type AnnouncementItem = {
  id: number;
  title: string;
  content: string;
  scope: 'global' | 'course' | 'personal';
  courseId?: number | null;
  createdAt: string;
  isRead: boolean; // hiện FE giả lập; nếu có bảng read thì BE trả thật
};
export type AnnouncementsResponse = { items: AnnouncementItem[]; total: number };
