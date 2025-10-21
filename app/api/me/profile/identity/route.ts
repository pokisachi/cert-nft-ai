import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { normalizeIdCard, normalizeName, toE164, sanitizeAddress } from "@/lib/normalizer";
import { checkDedup } from "@/lib/dedup";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ifMatch = req.headers.get("if-match");
    if (ifMatch && ifMatch !== `W/"${user.row_version}"`) {
      return NextResponse.json({ reason: "VERSION_CONFLICT" }, { status: 409 });
    }

    const body = await req.json();

    // --- PHẦN SỬA LỖI ---
    // Bổ sung bước kiểm tra idcard có bị trùng lặp với người dùng khác không
    const normalizedIdCard = normalizeIdCard(body.idcard);
    if (normalizedIdCard) {
      const existingUserWithIdCard = await prisma.user.findFirst({
        where: {
          idcard: normalizedIdCard,
          // Điều kiện quan trọng: id phải khác với id của user đang cập nhật
          NOT: {
            id: user.id,
          },
        },
      });

      if (existingUserWithIdCard) {
        // Nếu đã tồn tại, trả về lỗi 409 (Conflict) với thông báo rõ ràng
        return NextResponse.json(
            { 
              duplicate: true,
              reason: "IDCARD_CONFLICT",
              message: "Số CMND/CCCD này đã được sử dụng bởi một tài khoản khác." 
            }, 
            { status: 409 }
        );
      }
    }
    // --- KẾT THÚC PHẦN SỬA LỖI ---

    const dup = await checkDedup(body, user.id);
    if (dup.duplicate)
      return NextResponse.json(dup, { status: 409 });

      const normalized = {
      name: body.name.trim(),
      name_norm: normalizeName(body.name),
      dob: body.dob ? new Date(body.dob) : null,
      phone: body.phone,
      phone_e164: toE164(body.phone),
      idcard: normalizedIdCard, // Sử dụng idcard đã được chuẩn hóa
      address: sanitizeAddress(body.address),
      avatarUrl: body.avatarUrl,
      profileCompleted: true,
    };

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...normalized,
        row_version: { increment: 1 },
      },
    });

    const safeUser = { ...updated, row_version: Number(updated.row_version) };

    return NextResponse.json(
      { message: "Updated", user: safeUser },
      {
        status: 200,
        headers: { ETag: `W/"${safeUser.row_version}"` },
      }
    );
  } catch (err: any) { // Cải thiện việc bắt lỗi
    console.error("[PUT /identity] Error:", err);
    // Bắt chính xác lỗi P2002 của Prisma để đưa ra thông báo thân thiện hơn
    if (err.code === 'P2002' && err.meta?.target?.includes('idcard')) {
        return NextResponse.json(
          { error: 'Số CMND/CCCD này đã tồn tại.' },
          { status: 409 }
        );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

