import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = Number(searchParams.get("page") || 1);
  const size = Number(searchParams.get("size") || 50);

  const skip = (page - 1) * size;

  const where: any = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const courses = await prisma.course.findMany({
    where,
    skip,
    take: size,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.course.count({ where });

  return NextResponse.json({ data: courses, total });
}

// ✅ Thêm mới — xử lý tạo khóa học
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const newCourse = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description || "",
        category: data.category,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        examDateExpected: data.examDateExpected ? new Date(data.examDateExpected) : null,
        status: data.status || "UPCOMING",
        isPublic: data.isPublic ?? true,
        thumbnail: data.thumbnail || "",
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/courses error:", error);
    return NextResponse.json({ error: "Không thể tạo khóa học" }, { status: 500 });
  }
}
