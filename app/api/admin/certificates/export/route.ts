import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { Parser } from "json2csv";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const revoked = searchParams.get("revoked");
  const courseId = searchParams.get("courseId");

  const where: any = {
    ...(courseId ? { courseId: Number(courseId) } : {}),
    ...(revoked ? { revoked: revoked === "true" } : {}),
    ...(q
      ? {
          OR: [
            { tokenId: { contains: q, mode: "insensitive" } },
            { ipfsCid: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const items = await prisma.certificate.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const data = items.map((c) => ({
    id: c.id,
    userName: c.user.name,
    userId: c.userId,
    courseTitle: c.course.title,
    courseId: c.courseId,
    issuedAt: c.issuedAt.toISOString(),
    tokenId: c.tokenId,
    ipfsCid: c.ipfsCid,
    docHash: c.docHash,
    revoked: c.revoked,
  }));

  const parser = new Parser();
  const csv = parser.parse(data);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="certificates_export.csv"',
    },
  });
}
