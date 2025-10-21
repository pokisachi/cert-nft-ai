import { prisma } from "@/lib/prisma";
import { normalizeName, toE164 } from "@/lib/normalizer";

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        name_norm: normalizeName(u.name || ""),
        phone_e164: toE164(u.phone || ""),
        row_version: 1,
        profileCompleted: Boolean(u.idcard && u.dob && u.phone && u.address),
      },
    });
  }
  console.log("✅ Backfill hoàn tất");
}

main().finally(() => prisma.$disconnect());
