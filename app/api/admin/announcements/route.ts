// [GET, POST] /api/admin/announcements
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

// -------------------------------
// 📘 [GET] Danh sách thông báo
// -------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const take = 10;
  const skip = (page - 1) * take;
  const title = searchParams.get("title") || "";
  const targetRoleParam = searchParams.get("targetRole");

  const targetRole =
    targetRoleParam && ["LEARNER", "ADMIN", "ALL"].includes(targetRoleParam)
      ? (targetRoleParam as Role)
      : undefined;

  // ✅ SQLite không cần mode / insensitive
  const where: Prisma.NotificationWhereInput = {
    ...(title
      ? {
          title: {
            contains: title,
          },
        }
      : {}),
    ...(targetRole ? { targetRole } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ data, total, page });
}

// -------------------------------
// 📨 [POST] Tạo mới thông báo
// -------------------------------
export async function POST(req: Request) {
  const body = await req.json();
  const { title, content, targetRole, courseId, isPinned } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Thiếu tiêu đề hoặc nội dung" },
      { status: 400 }
    );
  }

  try {
    const newNotification = await prisma.notification.create({
      data: {
        title,
        content,
        targetRole: targetRole as Role,
        courseId: courseId ? Number(courseId) : null,
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
