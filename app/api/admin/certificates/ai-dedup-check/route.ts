import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const AI_BASE =
  process.env.AI_DEDUP_SERVICE_URL ||
  process.env.AI_BASE_URL ||
  "http://127.0.0.1:8001";

const AI_ENDPOINT = `${AI_BASE.replace(/\/$/, "")}/api/admin/certificates/ai-dedup-check`;

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  // FE gửi items + options, không phải certificates
  const { items, options } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "EMPTY_PAYLOAD" }, { status: 400 });
  }

  // Forward y chang sang Python
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, options }),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: "AI_DEDUP_FAILED",
          status: response.status,
          detail: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const payload = JSON.parse(text);
    return NextResponse.json(payload);

  } catch (err) {
    console.error("AI Proxy Error:", err);
    return NextResponse.json(
      { error: "AI_DEDUP_UNREACHABLE" },
      { status: 503 }
    );
  }
}
