import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        thumbnail: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const data = courses.map((c) => {
      let thumbnailUrl = "/default-thumbnail.png";

      if (c.thumbnail) {
        if (c.thumbnail.startsWith("/courses/")) {
          // ✅ đã là đường dẫn public
          thumbnailUrl = c.thumbnail;
        } else if (c.thumbnail.startsWith("blob:")) {
          // ⚠️ là blob URL cũ → bỏ qua, dùng default
          thumbnailUrl = "/default-thumbnail.png";
        } else {
          // ✅ là tên file → nối vào
          thumbnailUrl = `${baseUrl}/courses/${c.thumbnail}`;
        }
      }

      return { ...c, thumbnailUrl };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/courses error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
