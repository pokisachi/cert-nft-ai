import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type RenderedCertificatePayload = {
  preIssueHash?: string;
  name?: string;
  pdf?: { base64?: string };
  metadata?: { examResultId?: number | string };
};

const AI_DEDUP_SERVICE_BASE =
  process.env.AI_DEDUP_SERVICE_URL ||
  process.env.AI_BASE_URL ||
  "http://127.0.0.1:8000";
const AI_DEDUP_ENDPOINT = `${AI_DEDUP_SERVICE_BASE.replace(
  /\/$/,
  ""
)}/api/admin/certificates/ai-dedup-check`;
const AI_DEDUP_SERVICE_TOKEN = process.env.AI_DEDUP_SERVICE_TOKEN;
const MAX_CERTIFICATES = getEnvInt("AI_DEDUP_MAX_ITEMS", 200);
const MAX_PDF_BYTES = getEnvInt("AI_DEDUP_MAX_PDF_MB", 10) * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const certificates: RenderedCertificatePayload[] = Array.isArray(
    body?.certificates
  )
    ? body.certificates
    : [];

  if (!certificates.length) {
    return NextResponse.json({ error: "EMPTY_PAYLOAD" }, { status: 400 });
  }

  if (certificates.length > MAX_CERTIFICATES) {
    return NextResponse.json(
      {
        error: "TOO_MANY_ITEMS",
        limit: MAX_CERTIFICATES,
      },
      { status: 422 }
    );
  }

  const examResultIds = new Set<number>();
  for (const cert of certificates) {
    const examResultId = Number(cert?.metadata?.examResultId);
    const pdfBase64 = cert?.pdf?.base64?.trim();
    if (!examResultId || !pdfBase64) {
      return NextResponse.json(
        { error: "INVALID_CERTIFICATE_PAYLOAD" },
        { status: 400 }
      );
    }

    if (estimateBase64Bytes(pdfBase64) > MAX_PDF_BYTES) {
      return NextResponse.json(
        {
          error: "PDF_TOO_LARGE",
          limitMb: Math.floor(MAX_PDF_BYTES / 1024 / 1024),
          certId: cert.preIssueHash ?? examResultId,
        },
        { status: 413 }
      );
    }

    examResultIds.add(examResultId);
  }

  const examResults = await prisma.examResult.findMany({
    where: { id: { in: Array.from(examResultIds) } },
    include: {
      user: true,
      examSession: { include: { course: true } },
    },
  });

  if (examResults.length !== examResultIds.size) {
    const missingIds = Array.from(examResultIds).filter(
      (id) => !examResults.find((er) => er.id === id)
    );
    return NextResponse.json(
      { error: "EXAM_RESULT_NOT_FOUND", missingIds },
      { status: 404 }
    );
  }

  const examResultMap = new Map(examResults.map((er) => [er.id, er]));

  const items = certificates.map((cert, index) => {
    const examResultId = Number(cert.metadata?.examResultId);
    const er = examResultMap.get(examResultId);
    if (!er) {
      throw new Error(`Missing exam result ${examResultId}`);
    }
    const pdfBase64 = cert?.pdf?.base64?.trim() ?? "";
    return {
      certId: String(
        cert.preIssueHash ?? `preview-${examResultId}-${index + 1}`
      ),
      studentName: er.user?.name ?? cert.name ?? "UNKNOWN",
      dob: er.user?.dob
        ? er.user.dob.toISOString().split("T")[0]
        : null,
      course:
        er.examSession?.course?.title ??
        `Course#${er.examSession?.courseId ?? "N/A"}`,
      pdfBase64,
    };
  });

  const options = sanitizeOptions(body?.options);

  try {
    const response = await fetch(AI_DEDUP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_DEDUP_SERVICE_TOKEN
          ? { Authorization: `Bearer ${AI_DEDUP_SERVICE_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ items, ...(options ? { options } : {}) }),
    });

    const text = await response.text();
    if (!response.ok) {
      const detail = text || response.statusText;
      console.error("[AI_DEDUP_PROXY] Service error:", detail);
      return NextResponse.json(
        {
          error: "AI_DEDUP_FAILED",
          status: response.status,
          detail: detail.slice(0, 512),
        },
        { status: 502 }
      );
    }

    let payload: any = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        console.error("[AI_DEDUP_PROXY] Invalid JSON payload:", text);
        return NextResponse.json(
          { error: "AI_DEDUP_INVALID_RESPONSE" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      checkedCount: payload?.meta?.processed ?? items.length,
      ...payload,
    });
  } catch (err) {
    console.error("[AI_DEDUP_PROXY] Unable to reach service:", err);
    return NextResponse.json(
      { error: "AI_DEDUP_UNREACHABLE" },
      { status: 503 }
    );
  }
}

function estimateBase64Bytes(b64: string) {
  const len = b64.length;
  if (!len) return 0;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (len * 3) / 4 - padding;
}

function sanitizeOptions(raw: any) {
  if (!raw || typeof raw !== "object") return undefined;
  const options: Record<string, number | boolean> = {};
  if (typeof raw.topK === "number") options.topK = raw.topK;
  if (typeof raw.thresholdUnique === "number")
    options.thresholdUnique = raw.thresholdUnique;
  if (typeof raw.thresholdDuplicate === "number")
    options.thresholdDuplicate = raw.thresholdDuplicate;
  if (typeof raw.returnDebug === "boolean")
    options.returnDebug = raw.returnDebug;
  return Object.keys(options).length ? options : undefined;
}

function getEnvInt(key: string, fallback: number) {
  const raw = process.env[key];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
