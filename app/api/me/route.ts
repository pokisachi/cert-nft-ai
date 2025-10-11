import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMagicSession } from "@/lib/magic-session";

export async function GET() {
  try {
    // ✅ Bản mới của Next.js cần `await cookies()`
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("magic_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const user = await verifyMagicSession(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
