import { PrismaClient, Role, EnrollStatus, CourseStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Đang seed dữ liệu học viên cho khóa học 'AI English A2'...");

  // 🧱 1️⃣ Xóa dữ liệu cũ theo đúng thứ tự (tránh lỗi khóa ngoại)
  await prisma.notificationRead.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.scheduledEnrollment.deleteMany({});
  await prisma.scheduledClass.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.course.deleteMany({ where: { title: "AI English A2" } });
  await prisma.user.deleteMany({ where: { role: Role.LEARNER } });

  // 🧱 2️⃣ Tạo khóa học AI English A2
  const course = await prisma.course.create({
    data: {
      title: "AI English A2",
      description: "Khóa học tiếng Anh A2 ứng dụng AI hỗ trợ luyện nghe nói, đọc viết.",
      category: "ENGLISH",
      startDate: new Date("2025-11-03"),
      endDate: new Date("2026-01-03"),
      examDateExpected: new Date("2026-01-10"),
      status: CourseStatus.ONGOING,
      isPublic: true,
      structure_lessons_per_week: 3,
      structure_lesson_duration: 90,
      requirement_qualification: "A1",
    },
  });

  console.log(`📘 Đã tạo khóa học '${course.title}' (ID: ${course.id})`);

  // 🧱 3️⃣ Tạo 50 học viên mẫu
  const learnersData = Array.from({ length: 50 }).map((_, i) => ({
    email: `student${i + 1}@example.com`,
    name: `Học viên ${i + 1}`,
    role: Role.LEARNER,
    phone: `090${String(100000 + i).slice(-6)}`,
    address: "TP.HCM",
    profileCompleted: true,
  }));

  await prisma.user.createMany({ data: learnersData });
  console.log("👨‍🎓 Đã tạo 50 học viên mẫu.");

  // 🧱 4️⃣ Lấy lại danh sách học viên
  const learners = await prisma.user.findMany({ where: { role: Role.LEARNER } });

  // 🧱 5️⃣ Danh sách ca học có thể chọn
  const TIME_SLOTS = [
    "Mon_MORNING",
    "Tue_AFTERNOON",
    "Wed_EVENING_1",
    "Thu_EVENING_2",
    "Fri_MORNING",
    "Sat_AFTERNOON",
  ];

  // 🧱 6️⃣ Tạo danh sách Enrollment
  const enrollmentsData = learners.map((u) => ({
    userId: u.id,
    courseId: course.id,
    status: EnrollStatus.PENDING,
    availableSlots: TIME_SLOTS.sort(() => 0.5 - Math.random()).slice(0, 2),
  }));

  await prisma.enrollment.createMany({ data: enrollmentsData });
  console.log(`✅ Đã tạo ghi danh cho ${learners.length} học viên vào khóa '${course.title}'.`);

  console.log("🌟 Hoàn tất seed dữ liệu học viên!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
