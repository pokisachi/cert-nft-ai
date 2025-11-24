// app/api/certificates/[tokenId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;

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

    // PDF Pinata vẫn giữ, nhưng chút nữa ta sẽ bỏ dùng ở UI
    const pdfUrl = `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}`;

    const audit = await prisma.auditLog.findFirst({
      where: {
        entity: "Certificate",
        entityId: cert.id.toString(),
        action: { in: ["CERTIFICATE_REVOKED", "CERTIFICATE_BURNED"] },
      },
      orderBy: { createdAt: "desc" },
    } as Prisma.AuditLogFindFirstArgs);

    return NextResponse.json({
      data: {
        tokenId: cert.tokenId,
        issuedAt: cert.issuedAt.toISOString(),
        revoked: Boolean(cert.revoked),
        student: {
          name: cert.user.name,
          email: cert.user.email,
          dob: cert.user.dob?.toISOString() ?? null,
          walletAddress: cert.user.walletAddress ?? null,
        },
        course: {
          title: cert.course.title,
          category: cert.course.category,
        },
        blockchain: {
          chainId,
          contract,
          txHash: cert.txHash,
          owner: cert.user.walletAddress ?? null,
        },
        revocation: audit
          ? {
              txHash: (audit.payload as any)?.revokeTxHash || null,
              at: audit.createdAt?.toISOString?.() || null,
            }
          : null,
        files: {
          pdf: pdfUrl,   // vẫn trả về, nhưng UI sẽ không dùng nữa nếu bạn muốn
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
