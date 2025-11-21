import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { mintCertificate } from "@/lib/onchain/mint";
import { renderLatexFinal } from "@/app/lib/pdf/latex/renderLatex";
import { Prisma } from "@prisma/client";
import { uploadToPinata } from "@/app/lib/ipfs/pinata";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      examResultId,
      issue_date,
      certificate_code,
      issuer_name,
      preIssueHash,
    } = body;

    // 1) Load exam result
    const r = await prisma.examResult.findUnique({
      where: { id: Number(examResultId) },
      include: {
        examSession: { include: { course: true } },
        user: true,
      },
    });

    if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (r.status !== "PASS")
      return NextResponse.json({ error: "NOT_PASS" }, { status: 409 });

    const courseId = r.examSession.courseId;

    // 2) AI Dedup check
    const ai = await prisma.aIDedupResult.findFirst({
      where: {
        userId: r.userId,
        courseId,
        preIssueHash,
      },
    });

    if (!ai || ai.status !== "unique") {
      return NextResponse.json({ error: "DEDUP_NOT_UNIQUE" }, { status: 409 });
    }

    // 3) Check wallet
    if (!r.user.walletAddress)
      return NextResponse.json(
        { error: "WALLET_MISSING" },
        { status: 409 }
      );

    // 4) Prevent duplicate mint
    const existed = await prisma.certificate.findFirst({
      where: { userId: r.userId, courseId },
    });

    if (existed) {
      return NextResponse.json({
        status: "ok",
        reused: true,
        tokenId: existed.tokenId,
        ipfsCid: existed.ipfsCid,
        docHash: existed.docHash,
        txHash: existed.txHash,
      });
    }

    // 5) Render final PDF
    const verifyUrlBase = process.env.VERIFY_BASE_URL ?? "";

    const pdf = await renderLatexFinal({
      data: {
        student_name: r.user.name,
        dob: r.user.dob?.toISOString().slice(0, 10) || "",
        course_title: r.examSession.course.title,
        exam_score: r.score,
        issue_date,
        certificate_code,
        issuer_name,
        verify_url: verifyUrlBase,
      },
      mode: "final",
    });

    const pdfBuffer = Buffer.isBuffer(pdf.pdfBuffer)
      ? pdf.pdfBuffer
      : Buffer.from(pdf.pdfBuffer);

    // SHA-256 hash
    const docHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    // 6) Upload PDF to Pinata
    const ipfsCid = await uploadToPinata(pdfBuffer, "certificate.pdf");

    // 7) Upload metadata.json
    const metadata = {
      name: `${r.user.name} Certificate`,
      description: "Course Completion Certificate",
      file: `ipfs://${ipfsCid}/certificate.pdf`,
    };

    const metadataCid = await uploadToPinata(
      Buffer.from(JSON.stringify(metadata)),
      "metadata.json"
    );

    const tokenUri = `ipfs://${metadataCid}`;

    // 8) Mint NFT
    const contract = process.env.CONTRACT_ADDRESS as `0x${string}`;
    if (!contract)
      return NextResponse.json({ error: "MISSING_CONTRACT" }, { status: 500 });

    const { txHash, tokenId } = await mintCertificate({
      contract,
      to: r.user.walletAddress as `0x${string}`,
      tokenUri,
    });

    if (!tokenId) {
      return NextResponse.json(
        { error: "MINT_NO_TOKENID", txHash },
        { status: 500 }
      );
    }

    // 9) Save to DB
    let created;
    try {
      created = await prisma.certificate.create({
        data: {
          userId: r.userId,
          courseId,
          examResultId: r.id,
          tokenId,
          ipfsCid,
          docHash,
          txHash,
        },
      });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "CERT_DUP_IPFS", detail: "ipfsCid already used" },
          { status: 409 }
        );
      }
      throw err;
    }

    const chainId = Number(process.env.CHAIN_ID ?? 89);

    return NextResponse.json({
      status: "ok",
      chainId,
      contract,
      tokenId,
      txHash,
      tokenUri,
      ipfsCid,
      verifyUrl: `${verifyUrlBase}${tokenId}`,
      docHash,
      pdf: {
        url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      },
    });
  } catch (e: any) {
    console.error("ISSUE_FINAL_ERROR", e);
    return NextResponse.json(
      { error: "INTERNAL", detail: e.message },
      { status: 500 }
    );
  }
}
