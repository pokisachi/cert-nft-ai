import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/stats
export async function GET() {
  try {
    const [learners, courses, exams, certificates, notifications] = await Promise.all([
      prisma.user.count({ where: { role: 'LEARNER' } }),
      prisma.course.count(),
      prisma.examSession.count(),
      prisma.certificate.count(),
      prisma.notification.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        learners,
        courses,
        exams,
        certificates,
        notifications,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
