import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySession(token);
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 10);
    const offset = Number(searchParams.get("offset") ?? 0);

    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where: { userId: session.uid },
        include: { course: true },
        skip: offset,
        take: limit,
        orderBy: { issuedAt: "desc" },
      }),
      prisma.certificate.count({ where: { userId: session.uid } }),
    ]);

    return NextResponse.json({
      items: items.map((cert: { id: any; courseId: any; course: { title: any; }; tokenId: any; ipfsCid: any; revoked: any; issuedAt: any; }) => ({
        id: cert.id,
        courseId: cert.courseId,
        courseTitle: cert.course.title,
        tokenId: cert.tokenId,
        ipfsCid: cert.ipfsCid,
        status: cert.revoked ? "REVOKED" : "VALID",
        issuedAt: cert.issuedAt,
        pdfUrl: `/cdn/cert/${cert.id}.pdf`,
        explorerUrl: `https://victionscan.io/token/${cert.tokenId}`,
      })),
      total,
    });
  } catch (error) {
    console.error("❌ [GET] /api/me/certificates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
