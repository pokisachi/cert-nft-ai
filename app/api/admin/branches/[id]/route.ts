export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { updateBranch, deleteBranch } from "@/lib/branchStore";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();
  try {
    const updated = await updateBranch(id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.message === 'NOT_FOUND') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const res = await deleteBranch(id);
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

