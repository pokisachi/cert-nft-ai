import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mintCertificate } from "@/lib/onchain/mint";
import { renderLatexFinal } from "@/lib/pdf/renderCertificateLatex";
import { storachaUpload } from "@/lib/ipfs/storacha";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      examResultId,
      issue_date,
      certificate_code,
      issuer_name
    } = body;

    // 1) Load exam + user
    const exam = await prisma.examResult.findUnique({
      where: { id: Number(examResultId) },
      include: {
        user: true,
        examSession: { include: { course: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (exam.status !== "PASS") return NextResponse.json({ error: "NOT_PASS" }, { status: 400 });

    const user = exam.user;
    const course = exam.examSession.course;

    // 2) Render PDF
    const verifyUrl = `${process.env.VERIFY_BASE_URL}${exam.id}`;

    const pdfBuffer = await renderLatexFinal({
      data: {
        student_name: user.name,
        dob: user.dob?.toISOString().slice(0, 10),
        course_title: course.title,
        exam_score: exam.score,
        issue_date,
        certificate_code,
        issuer_name,
        verify_url: verifyUrl,
      },
      mode: "final",
    });

    const docHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    // 3) Upload PDF → Storacha
    const CID_PDF = await storachaUpload(pdfBuffer, "certificate.pdf");

    // 4) Create metadata.json
    const metadata = {
      name: `Certificate #${exam.id} — ${course.title}`,
      description: "Official blockchain certificate NFT.",
      animation_url: `ipfs://${CID_PDF}/certificate.pdf`,
      attributes: [
        { trait_type: "Student Name", value: user.name },
        { trait_type: "Course", value: course.title },
        { trait_type: "Score", value: exam.score },
        {
          trait_type: "Issued Date",
          display_type: "date",
          value: Math.floor(new Date(issue_date).getTime() / 1000),
        },
        { trait_type: "Certificate Code", value: certificate_code },
        { trait_type: "Verify URL", value: verifyUrl },
      ],
    };

    // 5) Upload metadata → Storacha
    const metadataCid = await storachaUpload(
      Buffer.from(JSON.stringify(metadata)),
      "metadata.json"
    );

    const tokenUri = `ipfs://${metadataCid}/metadata.json`;

    // 6) Mint NFT
    const txHash = await mintCertificate({
      contract: process.env.CONTRACT_ADDRESS as `0x${string}`,
      to: user.walletAddress as `0x${string}`,
      tokenUri,
    });

    // 7) Save certificate record
    const saved = await prisma.certificate.create({
      data: {
        userId: user.id,
        courseId: course.id,
        examResultId: exam.id,
        tokenUri,
        ipfsCid: metadataCid,
        docHash,
        txHash,
      },
    });

    return NextResponse.json({
      status: "ok",
      tokenUri,
      metadataCid,
      pdfCid: CID_PDF,
      txHash,
      certificate: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
