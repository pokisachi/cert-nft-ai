import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Đang xoá dữ liệu người dùng và các bản ghi liên quan...");

  // 🧱 Xoá theo thứ tự tránh lỗi khoá ngoại (foreign key)
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.scheduledEnrollment.deleteMany();
  await prisma.scheduledClass.deleteMany();

  // Cuối cùng: xoá học viên
  await prisma.user.deleteMany({
    where: {
      role: "LEARNER",
    },
  });

  console.log("✅ Đã xoá xong toàn bộ học viên!");
}

main()
  .catch((err) => {
    console.error("❌ Lỗi xoá dữ liệu:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
