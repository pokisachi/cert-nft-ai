// app/api/me/profile/identity:rules/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    idCard: { pattern: "^[A-Z0-9]{6,20}$" },
    dob: { format: "YYYY-MM-DD" },
    phone: { format: "E.164" },
    address: { min: 5, max: 255, disallowHtml: true },
    avatarUrl: { type: "url" },
  });
}
