import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { revokeOrBurnCertificate } from "@/lib/onchain/mint";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const reason = body.reason || "No reason provided";
  const onchain = body.onchain !== false; // mặc định burn on-chain, có thể tắt bằng onchain=false
  const bodyTokenId = typeof body.tokenId === "string" || typeof body.tokenId === "number" ? String(body.tokenId) : null;
  let revokeTxHash: string | null = null;
  let onchainError: string | null = null;

  let cert = await prisma.certificate.findUnique({ where: { id: Number(id) } });
  if (!cert && bodyTokenId) {
    cert = await prisma.certificate.findUnique({ where: { tokenId: bodyTokenId } });
  }
  if (!cert)
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  if (!cert.revoked) {
    if (onchain && cert.tokenId) {
      try {
        const contract = (process.env.CONTRACT_ADDRESS || "") as `0x${string}`;
        if (contract && contract.startsWith("0x")) {
          const { txHash } = await revokeOrBurnCertificate({
            contract,
            tokenId: BigInt(cert.tokenId),
          });
          revokeTxHash = txHash;
        }
      } catch (err: any) {
        console.error("❌ Burn on-chain failed:", err);
        onchainError = err?.shortMessage || err?.message || "ONCHAIN_REVOKE_FAILED";
        // tiếp tục revoke off-chain, nhưng trả cảnh báo cho FE
      }
    }

    await prisma.certificate.update({
      where: { id: cert.id },
      data: { revoked: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CERTIFICATE_REVOKED",
        entity: "Certificate",
        entityId: String(cert.id),
        payload: { reason, revokeTxHash, onchainError },
      },
    });
  }

  return NextResponse.json({ ok: true, revoked: true, txHash: revokeTxHash, onchainError });
}
