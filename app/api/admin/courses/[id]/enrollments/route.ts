// app/api/admin/courses/[id]/enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, parseSort } from "@/lib/query";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const courseId = Number(id);

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  try {
    await getAuthUser(req);

    const { skip, take, page, pageSize } = parsePagination(req);
    const { field, direction } = parseSort(req);

    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q");

    const where: any = {
      courseId,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              walletAddress: true,
            },
          },
          course: { select: { id: true, title: true } },
        },
        orderBy: { [field]: direction },
        skip,
        take,
      }),
    ]);

    // ✅ Chuẩn hóa dữ liệu trả về cho FE
    const data = rows.map((r) => {
      let availableSlots: string[] = [];

      if (Array.isArray(r.availableSlots)) {
        availableSlots = r.availableSlots;
      } else if (typeof r.availableSlots === "string") {
        try {
          const parsed = JSON.parse(r.availableSlots);
          if (Array.isArray(parsed)) {
            availableSlots = parsed;
          }
        } catch {
          availableSlots = [];
        }
      }

      return {
        enrollmentId: r.id,
        learner: {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          walletAddress: r.user.walletAddress ?? "—",
        },
        course: { id: r.course.id, title: r.course.title },
        availableSlots,
        status: r.status,
        createdAt: r.enrolledAt,
      };
    });

    return NextResponse.json({
      data,
      meta: { page, pageSize, total },
    });
  } catch (err: any) {
    console.error("❌ [Admin GET Course Enrollments]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
