import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Role, Prisma } from "@prisma/client";

// ✅ Helper: chuyển BigInt → Number để tránh lỗi JSON
function toSerializable(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "10");
    const q = searchParams.get("search")?.trim() || "";

    const where: Prisma.UserWhereInput = {
      role: Role.LEARNER,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,            // ✅ thêm
          walletAddress: true,    // ✅ thêm
          createdAt: true,
          profileCompleted: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(toSerializable({ items, page, size, total }));
  } catch (err) {
    console.error("GET /api/admin/learners error:", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi tải danh sách học viên" },
      { status: 500 }
    );
  }
}
