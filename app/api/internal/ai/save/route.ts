import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { examResultId, userId, courseId, similarityScore, preIssueHash, status } = body;

  if (!examResultId || !userId || !courseId || !preIssueHash || !status) {
    return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS" }, { status: 400 });
  }

  try {
    const result = await prisma.aIDedupResult.create({
      data: {
        examResultId,
        userId,
        courseId,
        preIssueHash,
        status,
        similarityScore,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error saving AI dedup result:", error);
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}
