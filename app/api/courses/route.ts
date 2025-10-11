import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // nếu bạn chưa có file này thì tạo bên dưới

// [GET] /api/courses → trả về các khóa học public
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        examDateExpected: true,
        status: true,
      },
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("GET /api/courses error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
