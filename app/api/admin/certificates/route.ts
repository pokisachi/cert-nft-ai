import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { Parser } from "json2csv"; // dùng cho export

// GET /api/admin/certificates
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Math.min(Number(searchParams.get("pageSize") || 20), 100);
  const courseId = searchParams.get("courseId");
  const userId = searchParams.get("userId");
  const revoked = searchParams.get("revoked");
  const q = searchParams.get("q");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sortBy = searchParams.get("sortBy") || "issuedAt";
  const sortDir = searchParams.get("sortDir") || "desc";

  const where: any = {
    ...(courseId ? { courseId: Number(courseId) } : {}),
    ...(userId ? { userId: Number(userId) } : {}),
    ...(revoked ? { revoked: revoked === "true" } : {}),
    ...(from || to
      ? {
          issuedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
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

  const [items, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, dob: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.certificate.count({ where }),
  ]);

  const result = items.map((c) => ({
    ...c,
    verifyUrl: `https://verify.example.com/cert/${c.tokenId}`,
  }));

  return NextResponse.json({
    items: result,
    pagination: { page, pageSize, total },
  });
}
