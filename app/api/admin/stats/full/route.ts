import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [learners, courses, exams, certificates] = await Promise.all([
      prisma.user.count({ where: { role: 'LEARNER' } }),
      prisma.course.count(),
      prisma.examSession.count(),
      prisma.certificate.count(),
    ]);

    // Phân bố độ tuổi học viên
    const users = await prisma.user.findMany({
      where: { role: 'LEARNER', dob: { not: null } },
      select: { dob: true },
    });

    const now = new Date();
    const ageGroups = {
      '5-10': 0,
      '11-18': 0,
      '19-25': 0,
      '26-30': 0,
      '30+': 0,
    };

    users.forEach((u) => {
      if (!u.dob) return;
      const age = now.getFullYear() - u.dob.getFullYear();
      if (age <= 10) ageGroups['5-10']++;
      else if (age <= 18) ageGroups['11-18']++;
      else if (age <= 25) ageGroups['19-25']++;
      else if (age <= 30) ageGroups['26-30']++;
      else ageGroups['30+']++;
    });

    return NextResponse.json({
      success: true,
      data: {
        learners,
        courses,
        exams,
        certificates,
        ageGroups,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
