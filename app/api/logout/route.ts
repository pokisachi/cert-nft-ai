import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Xóa cookie session
  (await
        // Xóa cookie session
        cookies()).set("auth_token", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
