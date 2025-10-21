// lib/dedup.ts
import { prisma } from "@/lib/prisma";
import { normalizeIdCard, normalizeName, toE164 } from "@/lib/normalizer";

/**
 * Kiểm tra trùng thông tin định danh trong bảng User.
 * Trả về { duplicate: true, reason: "..." } nếu phát hiện trùng.
 */
export async function checkDedup(input: any, currentUserId: number) {
  // 🔹 Chuẩn hoá CMND/CCCD
  const idCardNorm = normalizeIdCard(input.idcard);
  if (idCardNorm) {
    const dupIdCard = await prisma.user.findFirst({
      where: { idcard: idCardNorm, NOT: { id: currentUserId } },
      select: { id: true },
    });
    if (dupIdCard) return { duplicate: true, reason: "ID_CARD_MATCH" };
  }

  // 🔹 Chuẩn hoá tổ hợp Name + DOB + Phone
  const nameNorm = normalizeName(input.name);
  const dob = input.dob ? new Date(input.dob) : null;
  const phoneNorm = toE164(input.phone);

  if (dob && phoneNorm && nameNorm) {
    const dupCombo = await prisma.user.findFirst({
      where: {
        name_norm: nameNorm,
        dob,
        phone_e164: phoneNorm,
        NOT: { id: currentUserId },
      },
      select: { id: true },
    });

    if (dupCombo)
      return { duplicate: true, reason: "NAME_DOB_PHONE_MATCH" };
  }

  return { duplicate: false };
}
