export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listBranches, addBranch, Branch } from "@/lib/branchStore";

export async function GET() {
  const branches = await listBranches();
  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item: Branch = body;
  if (!item || !item.id || !item.name || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  try {
    const created = await addBranch(item);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === 'DUPLICATE_ID') {
      return NextResponse.json({ error: 'DUPLICATE_ID' }, { status: 409 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

