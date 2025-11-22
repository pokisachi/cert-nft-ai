import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);
    const q = (searchParams.get("q") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (q) {
      const qNum = !Number.isNaN(Number(q)) ? Number(q) : null;
      where.OR = [
        { tokenId: q },
        qNum ? { tokenId: String(qNum) } : undefined,
        { ipfsCid: { contains: q, mode: "insensitive" } },
        { course: { is: { title: { contains: q, mode: "insensitive" } } } },
      ].filter(Boolean);
    }
    if (status === "VALID") where.revoked = false;
    if (status === "REVOKED") where.revoked = true;

    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: { course: true },
        orderBy: { issuedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({
        tokenId: c.tokenId,
        courseTitle: c.course.title,
        issuedAt: c.issuedAt,
        status: c.revoked ? "REVOKED" : "VALID",
        ipfsCid: c.ipfsCid,
      })),
      pagination: { page, pageSize, total },
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}