import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySession(token);
    const cert = await prisma.certificate.findFirst({
      where: {
        id: Number(params.id),
        userId: session.uid, // chỉ lấy chứng chỉ của user đang login
      },
      include: {
        course: true,
        user: true,
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = {
      id: cert.id,
      courseId: cert.courseId,
      courseTitle: cert.course.title,
      tokenId: cert.tokenId,
      ipfsCid: cert.ipfsCid,
      ownerAddress: cert.user.walletAddress,
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x0000...",
      creatorAddress: process.env.NEXT_PUBLIC_CREATOR_ADDRESS ?? "0x0000...",
      status: cert.revoked ? "REVOKED" : "VALID",
      issuedAt: cert.issuedAt,
      pdfUrl: `/cdn/cert/${cert.id}.pdf`,
      explorerUrl: `https://victionscan.io/token/${cert.tokenId}`,
    };

    return NextResponse.json({ item });
  } catch (error) {
    console.error("❌ GET /certificates/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
