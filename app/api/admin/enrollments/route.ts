// app/api/admin/enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, parseSort } from "@/lib/query";
import { EnrollStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthUser(req); // ✅ thêm await
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { skip, take, page, pageSize } = parsePagination(req);
    const { field, direction } = parseSort(req);

    const courseId = req.nextUrl.searchParams.get("courseId");
    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q");

    const where: any = {
      ...(courseId ? { courseId: Number(courseId) } : {}),
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
          user: { select: { id: true, name: true, email: true, walletAddress: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { [field]: direction },
        skip,
        take,
      }),
    ]);

    const data = rows.map((r) => ({
      enrollmentId: r.id,
      learner: r.user,
      course: r.course,
      availableSlots: Array.isArray(r.availableSlots) ? r.availableSlots : [],
      status: r.status,
      createdAt: r.enrolledAt,
    }));

    return NextResponse.json({ data, meta: { page, pageSize, total } });
  } catch (err: any) {
    console.error("❌ GET /api/admin/enrollments", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ POST: Admin có thể tạo enrollment thủ công
export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthUser(req);
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { userId, courseId, availableSlots } = body;
    if (!userId || !courseId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: Number(userId),
        courseId: Number(courseId),
        availableSlots: Array.isArray(availableSlots)
          ? availableSlots
          : [],
        status: EnrollStatus.ACTIVE,
      },
      include: {
        user: { select: { id: true, name: true, email: true, walletAddress: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(enrollment);
  } catch (err: any) {
    console.error("❌ POST /api/admin/enrollments", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
