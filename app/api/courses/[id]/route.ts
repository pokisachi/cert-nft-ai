import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> } // ✅ kiểu Promise
) {
  try {
    const { id } = await context.params; // ✅ phải await

    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        startDate: true,
        endDate: true,
        examDateExpected: true,
        status: true,
        thumbnail: true,
      },
    });

    if (!course)
      return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json(course);
  } catch (err) {
    console.error("GET /api/courses/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
