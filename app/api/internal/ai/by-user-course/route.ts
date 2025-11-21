// app/api/internal/ai/by-user-course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    const latest = await prisma.aIDedupResult.findFirst({
      where: { userId, courseId },
      orderBy: { checkedAt: "desc" },
    });

    return NextResponse.json({ latest });
  } catch (err: any) {
    return NextResponse.json(
      { error: "INTERNAL", detail: err.message },
      { status: 500 }
    );
  }
}
