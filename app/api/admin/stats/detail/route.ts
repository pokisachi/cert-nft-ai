import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'certificates'; // learners | courses | exams | certificates
    const range = url.searchParams.get('range') || 'month'; // day | week | month | year

    let records: Date[] = [];

    switch (type) {
      case 'learners':
        records = (
          await prisma.user.findMany({
            where: { role: 'LEARNER' },
            select: { createdAt: true },
          })
        ).map((r) => r.createdAt);
        break;

      case 'courses':
        records = (
          await prisma.course.findMany({
            select: { createdAt: true },
          })
        ).map((r) => r.createdAt);
        break;

      case 'exams':
        records = (
          await prisma.examSession.findMany({
            select: { date: true },
          })
        ).map((r) => r.date);
        break;

      case 'certificates':
      default:
        records = (
          await prisma.certificate.findMany({
            select: { issuedAt: true },
          })
        ).map((r) => r.issuedAt);
        break;
    }

    const grouped = groupByRange(records, range);

    return NextResponse.json({
      success: true,
      data: grouped,
      meta: { type, range },
    });
  } catch (error) {
    console.error('❌ Error fetching detail stats:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// === Helper ===
function groupByRange(dates: Date[], range: string) {
  const result: Record<string, number> = {};

  for (const d of dates) {
    const date = new Date(d);
    let key = '';

    switch (range) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        key = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        break;
      case 'year':
        key = `${date.getFullYear()}`;
        break;
      default: // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

function getWeekNumber(date: Date) {
  const first = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((+date - +first) / 86400000);
  return Math.ceil((days + first.getDay() + 1) / 7);
}
