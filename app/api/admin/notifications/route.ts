// [GET] /api/notifications?role=LEARNER
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client"; // ✅ import enum Role từ Prisma

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Lấy query param "role" hoặc mặc định LEARNER
  const roleParam = searchParams.get("role") || "LEARNER";

  // ✅ Ép kiểu an toàn: chỉ nhận giá trị hợp lệ thuộc enum Role
  const role =
    roleParam && ["LEARNER", "ADMIN"].includes(roleParam)
      ? (roleParam as Role)
      : Role.LEARNER;

  // ✅ Tạo điều kiện where an toàn kiểu
  const data = await prisma.notification.findMany({
    where: {
      OR: [
        { targetRole: role }, // enum Role, không còn lỗi type
        { targetRole: "ALL" as Role }, // ép kiểu hợp lệ cho "ALL"
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(data);
}
