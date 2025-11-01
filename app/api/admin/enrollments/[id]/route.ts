// app/api/admin/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { EnrollStatus } from "@prisma/client";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await getAuthUser(req);
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const newStatus = body.status as EnrollStatus | undefined;
    const finalStatus = newStatus || EnrollStatus.ACTIVE;

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: finalStatus,
        ...(Array.isArray(body.availableSlots)
          ? { availableSlots: body.availableSlots }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, walletAddress: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/admin/enrollments/[id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await getAuthUser(req);
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, walletAddress: true } },
        course: { select: { id: true, title: true } },
      },
    });

    if (!enrollment)
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    return NextResponse.json(enrollment);
  } catch (err: any) {
    console.error("❌ GET /api/admin/enrollments/[id]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
