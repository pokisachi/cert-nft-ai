import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;

    // 1) Lấy certificate + user + course
    const cert = await prisma.certificate.findUnique({
      where: { tokenId }, // tokenId là string trong schema
      include: {
        user: true,
        course: true,
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const chainId = Number(process.env.CHAIN_ID ?? 89);
    const contract = process.env.CONTRACT_ADDRESS ?? "";

    // 2) URL PDF (Pinata)
    const pdfUrl = `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}`;

    // 3) (Tạm thời) chưa có metadataCid nên để null
    const metadataUrl: string | null = null;

    return NextResponse.json({
      data: {
        tokenId: cert.tokenId,
        issuedAt: cert.issuedAt.toISOString(),
        student: {
          name: cert.user.name,
          email: cert.user.email,
          dob: cert.user.dob?.toISOString() ?? null,
        },
        course: {
          title: cert.course.title,
          category: cert.course.category,
        },
        blockchain: {
          chainId,
          contract,
          txHash: cert.txHash,
        },
        files: {
          pdf: pdfUrl,
          metadata: metadataUrl,
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
