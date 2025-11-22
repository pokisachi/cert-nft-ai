export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listBranches } from "@/lib/branchStore";

export async function GET() {
  const branches = await listBranches();
  return NextResponse.json(branches);
}
