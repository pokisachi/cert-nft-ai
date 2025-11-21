import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: "MISSING_SESSION_ID" }, { status: 400 });
  }

  try {
    // Get exam results for this session
    const examResults = await prisma.examResult.findMany({
      where: {
        examSessionId: parseInt(sessionId),
        status: "PASS"
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get AI dedup results for these exam results
    const aiDedupResults = await prisma.aIDedupResult.findMany({
      where: {
        examResultId: {
          in: examResults.map(r => r.id)
        }
      },
      orderBy: {
        checkedAt: "desc"
      }
    });

    // Map to include user names and exam result info
    const results = aiDedupResults.map(result => {
      const examResult = examResults.find(er => er.id === result.examResultId);
      return {
        ...result,
        userName: examResult?.user?.name || "Unknown User"
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error fetching AI dedup by session:", error);
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 500 });
  }
}
