// app/api/admin/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser  } from '@/lib/auth';
import { EnrollStatus } from '@prisma/client';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    getAuthUser (req);
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json().catch(() => null);
    const newStatus = body?.status as EnrollStatus | undefined;
    if (!newStatus) return NextResponse.json({ error: 'InvalidInput' }, { status: 422 });

    if (!Object.values(EnrollStatus).includes(newStatus))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const updated = await prisma.enrollment.update({
      where: { id },
      data: { status: newStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      enrollmentId: updated.id,
      learner: updated.user,
      course: updated.course,
      preferredDays: updated.preferredDays?.split(',') ?? [],
      preferredTime: updated.preferredTime,
      status: updated.status,
      createdAt: updated.enrolledAt,
    });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (err.code === 'P2025') return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
