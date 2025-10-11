import { PrismaClient, Role, ExamStatus, CourseStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // ============ USERS ============
  const users = await prisma.user.createMany({
    data: [
      { email: 'admin@example.com', name: 'Admin', role: Role.ADMIN, phone: '0909000001', address: 'HCM', avatarUrl: '/avatars/admin.png' },
      { email: 'an.nguyen@example.com', name: 'Nguyễn Văn An', dob: new Date('2002-05-10'), phone: '0909000002', address: 'HCM', avatarUrl: '/avatars/1.png' },
      { email: 'hoa.tran@example.com', name: 'Trần Thị Hoa', dob: new Date('2001-07-20'), phone: '0909000003', address: 'Hà Nội', avatarUrl: '/avatars/2.png' },
      { email: 'hung.le@example.com', name: 'Lê Minh Hùng', dob: new Date('2003-03-12'), phone: '0909000004', address: 'Đà Nẵng', avatarUrl: '/avatars/3.png' },
      { email: 'linh.pham@example.com', name: 'Phạm Thuỳ Linh', dob: new Date('2000-09-01'), phone: '0909000005', address: 'Huế', avatarUrl: '/avatars/4.png' },
      { email: 'tuan.vo@example.com', name: 'Võ Anh Tuấn', dob: new Date('2001-12-15'), phone: '0909000006', address: 'Cần Thơ', avatarUrl: '/avatars/5.png' },
      { email: 'hiep.nguyen@example.com', name: 'Nguyễn Hữu Hiệp', dob: new Date('2002-11-05'), phone: '0909000007', address: 'Bình Dương', avatarUrl: '/avatars/6.png' },
      { email: 'nga.bui@example.com', name: 'Bùi Thị Nga', dob: new Date('2003-02-25'), phone: '0909000008', address: 'Đồng Nai', avatarUrl: '/avatars/7.png' },
      { email: 'khoa.tran@example.com', name: 'Trần Quốc Khoa', dob: new Date('2000-01-18'), phone: '0909000009', address: 'HCM', avatarUrl: '/avatars/8.png' },
      { email: 'hanh.pham@example.com', name: 'Phạm Mỹ Hạnh', dob: new Date('2004-06-09'), phone: '0909000010', address: 'Hà Nội', avatarUrl: '/avatars/9.png' },
    ]
  });
  console.log('✅ Users seeded');

  // ============ COURSES ============
  const courses = await prisma.course.createMany({
    data: [
      { title: 'Tin học A', category: 'Tin học', description: 'Khóa học tin học văn phòng cơ bản', startDate: new Date('2025-09-01'), endDate: new Date('2025-10-15'), examDateExpected: new Date('2025-10-20'), status: CourseStatus.ONGOING },
      { title: 'Tin học B', category: 'Tin học', description: 'Nâng cao kỹ năng Word, Excel, PowerPoint', startDate: new Date('2025-07-01'), endDate: new Date('2025-08-15'), examDateExpected: new Date('2025-08-20'), status: CourseStatus.COMPLETED },
      { title: 'Anh văn A2', category: 'Anh văn', description: 'Luyện thi chứng chỉ tiếng Anh trình độ A2', startDate: new Date('2025-09-10'), endDate: new Date('2025-11-01'), examDateExpected: new Date('2025-11-05'), status: CourseStatus.ONGOING },
      { title: 'Anh văn B1', category: 'Anh văn', description: 'Khóa luyện thi tiếng Anh trình độ B1', startDate: new Date('2025-06-01'), endDate: new Date('2025-07-15'), examDateExpected: new Date('2025-07-20'), status: CourseStatus.CLOSED },
      { title: 'Tin học ứng dụng', category: 'Tin học', description: 'Ứng dụng CNTT trong văn phòng', startDate: new Date('2025-10-01'), endDate: new Date('2025-11-15'), examDateExpected: new Date('2025-11-20'), status: CourseStatus.UPCOMING },
    ]
  });
  console.log('✅ Courses seeded');

  // ============ EXAM SESSIONS ============
  const sessions = await prisma.examSession.createMany({
    data: [
      { courseId: 1, room: 'A101', date: new Date('2025-10-20'), capacity: 20 },
      { courseId: 2, room: 'B202', date: new Date('2025-08-20'), capacity: 20 },
      { courseId: 3, room: 'A102', date: new Date('2025-11-05'), capacity: 25 },
      { courseId: 4, room: 'C301', date: new Date('2025-07-20'), capacity: 15 },
      { courseId: 5, room: 'A103', date: new Date('2025-11-20'), capacity: 30 },
    ]
  });
  console.log('✅ ExamSessions seeded');

  // ============ EXAM RESULTS ============
  await prisma.examResult.createMany({
    data: [
      { examSessionId: 1, userId: 2, score: 85, status: ExamStatus.PASS },
      { examSessionId: 1, userId: 3, score: 70, status: ExamStatus.PASS },
      { examSessionId: 2, userId: 4, score: 60, status: ExamStatus.FAIL },
      { examSessionId: 3, userId: 5, score: 90, status: ExamStatus.PASS },
      { examSessionId: 3, userId: 6, score: 55, status: ExamStatus.FAIL },
      { examSessionId: 4, userId: 7, score: 78, status: ExamStatus.PASS },
      { examSessionId: 4, userId: 8, score: 40, status: ExamStatus.FAIL },
      { examSessionId: 2, userId: 9, score: 80, status: ExamStatus.PASS },
      { examSessionId: 1, userId: 10, score: 82, status: ExamStatus.PASS },
      { examSessionId: 5, userId: 5, score: 0, status: ExamStatus.PENDING },
    ]
  });
  console.log('✅ ExamResults seeded');

  // ============ CERTIFICATES ============
  await prisma.certificate.createMany({
    data: [
      { userId: 2, courseId: 1, tokenId: 'NFT001', ipfsCid: 'QmCID001' },
      { userId: 3, courseId: 1, tokenId: 'NFT002', ipfsCid: 'QmCID002' },
      { userId: 5, courseId: 3, tokenId: 'NFT003', ipfsCid: 'QmCID003' },
      { userId: 7, courseId: 4, tokenId: 'NFT004', ipfsCid: 'QmCID004' },
      { userId: 9, courseId: 2, tokenId: 'NFT005', ipfsCid: 'QmCID005' },
    ]
  });
  console.log('✅ Certificates seeded');

  // ============ NOTIFICATIONS ============
  await prisma.notification.createMany({
    data: [
      { title: 'Khai giảng khóa Tin học A', content: 'Khóa học bắt đầu ngày 1/9/2025, phòng A1.', courseId: 1 },
      { title: 'Kết quả thi Tin học B', content: 'Điểm thi Tin học B đã được công bố!', courseId: 2 },
      { title: 'Lịch thi Anh văn A2', content: 'Thi ngày 5/11/2025 tại phòng A102.', courseId: 3 },
      { title: 'Cấp chứng chỉ mới', content: 'Chứng chỉ Tin học A đã được cấp.', userId: 2 },
      { title: 'Thông báo học phí', content: 'Vui lòng hoàn tất học phí khóa Anh văn B1 trước ngày 20/6.', courseId: 4 },
    ]
  });
  console.log('✅ Notifications seeded');
}

main()
  .then(() => console.log('🎉 Database seeding completed!'))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
