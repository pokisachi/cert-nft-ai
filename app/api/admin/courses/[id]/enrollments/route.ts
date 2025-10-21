// app/api/admin/courses/[id]/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parsePagination, parseSort, parseCSV } from '@/lib/query';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // ✅ phải await Promise này
  const courseId = Number(id);

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  try {
    await getAuthUser(req);
    const { skip, take, page, pageSize } = parsePagination(req);
    const { field, direction } = parseSort(req);

    const preferredDaysArr = parseCSV(req.nextUrl.searchParams.get('preferredDays'));
    const preferredTime = req.nextUrl.searchParams.get('preferredTime');
    const status = req.nextUrl.searchParams.get('status');
    const q = req.nextUrl.searchParams.get('q');

    const where: any = {
      courseId,
      ...(status ? { status } : {}),
      ...(preferredTime ? { preferredTime } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q, mode: 'insensitive' } } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    if (preferredDaysArr.length > 0) {
      where.OR = preferredDaysArr.map((day) => ({
        preferredDays: { contains: day },
      }));
    }

    const [total, rows] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { [field]: direction },
        skip,
        take,
      }),
    ]);

    const data = rows.map((r) => ({
      enrollmentId: r.id,
      learner: { id: r.user.id, name: r.user.name, email: r.user.email },
      course: { id: r.course.id, title: r.course.title },
      preferredDays: r.preferredDays ? r.preferredDays.split(',') : [],
      preferredTime: r.preferredTime,
      status: r.status,
      createdAt: r.enrolledAt,
    }));

    return NextResponse.json({ data, meta: { page, pageSize, total } });
  } catch (err: any) {
    console.error('[Enrollment GET]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
