import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

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

  const cert = await prisma.certificate.findUnique({ where: { id: Number(id) } });
  if (!cert)
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  if (!cert.revoked) {
    await prisma.certificate.update({
      where: { id: Number(id) },
      data: { revoked: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CERTIFICATE_REVOKED",
        entity: "Certificate",
        entityId: String(cert.id),
        payload: { reason },
      },
    });
  }

  return NextResponse.json({ ok: true, revoked: true });
}
