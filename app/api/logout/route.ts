export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.set("auth_token", "", { path: "/", maxAge: 0 });
  store.set("pc", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
