const vi = {
  dashboard: 'Tổng quan',
  myCourses: 'Khóa học của tôi',
  myCertificates: 'Chứng chỉ của tôi',
  announcements: 'Thông báo',
  viewAll: 'Xem tất cả',
  profile: 'Hồ sơ',
  empty_courses: 'Chưa có khóa học',
  empty_certificates: 'Bạn sẽ thấy chứng chỉ sau khi đậu và được cấp',
  empty_announcements: 'Chưa có thông báo',
  retry: 'Thử lại',
  markRead: 'Đánh dấu đã đọc',
  new: 'Mới',
  downloadPdf: 'Tải PDF',
  share: 'Chia sẻ',
  view: 'Xem',
  openOnChain: 'Xem on-chain',
  registerCourse: 'Đăng ký khóa học',
  loading: 'Đang tải…',
  error: 'Đã có lỗi xảy ra.',
};
const en = { ...vi, dashboard: 'Dashboard', myCourses: 'My Courses', myCertificates: 'My Certificates', announcements: 'Announcements', viewAll: 'View All', profile: 'Profile', empty_courses: 'No courses yet', empty_certificates: 'You will see certificates after passing', empty_announcements: 'No announcements', retry: 'Retry', markRead: 'Mark as read', new: 'NEW', downloadPdf: 'Download PDF', share: 'Share', view: 'View', openOnChain: 'Open on-chain', registerCourse: 'Browse courses', loading: 'Loading…', error: 'Something went wrong.' };
const dict = { vi, en };

export function t(key: keyof typeof vi) {
  const lang = (process.env.NEXT_PUBLIC_I18N_DEFAULT || 'vi') as 'vi' | 'en';
  return (dict[lang] as any)[key] ?? key;
}
