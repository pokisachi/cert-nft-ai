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
} as const;


const dict = { vi } as const;

type SupportedLang = keyof typeof dict;
type TranslationKey = keyof typeof vi;

export function t(key: TranslationKey): string {
  const lang = (process.env.NEXT_PUBLIC_I18N_DEFAULT || 'vi') as SupportedLang;
  const translationSet = dict[lang];
  return translationSet[key] ?? key;
}
