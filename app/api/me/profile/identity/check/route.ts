// app/api/me/profile/identity:check/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkDedup } from "@/lib/dedup";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await checkDedup(body, user.id);

  return NextResponse.json(result);
}
