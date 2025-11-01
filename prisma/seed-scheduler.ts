// prisma/seed-scheduler.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu test cho AI Scheduler...');

  // 1️⃣ Course
  const course = await prisma.course.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      title: 'English Communication B2',
      description: 'Khóa học luyện giao tiếp tiếng Anh trình độ B2.',
      category: 'ENGLISH',
      structure_lessons_per_week: 2,
      structure_lesson_duration: 90,
      requirement_qualification: 'ENGLISH_B2',
    },
  });

  // 2️⃣ Qualification
  const qualification = await prisma.qualification.upsert({
    where: { id: 'qual_english_b2' },
    update: {},
    create: {
      id: 'qual_english_b2',
      name: 'ENGLISH_B2',
      category: 'ENGLISH',
      description: 'Trình độ tiếng Anh B2 theo CEFR',
    },
  });

  // 3️⃣ Teacher
  const teacher = await prisma.teacher.upsert({
    where: { id: 'teacher_john' },
    update: {},
    create: {
      id: 'teacher_john',
      name: 'John Smith',
      availability: ['Mon_MORNING', 'Wed_AFTERNOON'],
    },
  });

  // Gán qualification cho giáo viên
  await prisma.teacherQualification.upsert({
    where: {
      id: 'link_teacher_john_english_b2',
    },
    update: {},
    create: {
      id: 'link_teacher_john_english_b2',
      teacherId: teacher.id,
      qualificationId: qualification.id,
    },
  });

  // 4️⃣ Room
  const room = await prisma.room.upsert({
    where: { id: 'A012' },
    update: {},
    create: {
      id: 'A012',
      capacity: 10,
      availability: ['Mon_MORNING', 'Wed_AFTERNOON'],
    },
  });

  // 5️⃣ User (learner)
  const learner = await prisma.user.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      email: 'learner@example.com',
      name: 'Nguyen Van A',
      role: 'LEARNER',
    },
  });

  // 6️⃣ Enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { id: 21 },
    update: {},
    create: {
      id: 21,
      userId: learner.id,
      courseId: course.id,
      availableSlots: ['Mon_MORNING', 'Wed_AFTERNOON'],
      status: 'PENDING',
    },
  });

  console.log('✅ Đã seed dữ liệu thành công!');
  console.table({ course: course.id, teacher: teacher.id, room: room.id, enrollment: enrollment.id });
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
