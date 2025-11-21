import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const courseId = searchParams.get("courseId");

  if (!userId || !courseId) {
    return NextResponse.json({ error: "MISSING_REQUIRED_PARAMS" }, { status: 400 });
  }

  try {
    const result = await prisma.aIDedupResult.findUnique({
      where: {
        userId_courseId_preIssueHash: {
          userId: parseInt(userId),
          courseId: parseInt(courseId),
          preIssueHash: searchParams.get("preIssueHash") || ""
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error checking AI dedup result:", error);
    return NextResponse.json({ error: "CHECK_FAILED" }, { status: 500 });
  }
}
