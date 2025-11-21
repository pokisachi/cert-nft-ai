import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;

    // Lấy certificate + user + course
    const cert = await prisma.certificate.findUnique({
      where: { tokenId },
      include: {
        user: true,
        course: true,
      },
    });

    if (!cert) {
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const chainId = Number(process.env.CHAIN_ID ?? 89);
    const contract = process.env.CONTRACT_ADDRESS ?? "";

    // PDF từ Pinata
    const pdfUrl = `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}`;

    return NextResponse.json({
      data: {
        tokenId: cert.tokenId,
        issuedAt: cert.issuedAt.toISOString(),
        student: {
          name: cert.user.name,
          email: cert.user.email,
          dob: cert.user.dob?.toISOString() ?? null,
          walletAddress: cert.user.walletAddress ?? null, // ⭐ thêm tại đây
        },
        course: {
          title: cert.course.title,
          category: cert.course.category,
        },
        blockchain: {
          chainId,
          contract,
          txHash: cert.txHash,
          owner: cert.user.walletAddress ?? null, // ⭐ thêm tại đây
        },
        files: {
          pdf: pdfUrl,
          metadata: null,
        },
      },
    });
  } catch (e: any) {
    console.error("CERT_DETAIL_ERROR", e);
    return NextResponse.json(
      { error: "INTERNAL", detail: e.message },
      { status: 500 }
    );
  }
}
