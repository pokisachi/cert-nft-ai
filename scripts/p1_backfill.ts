import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Bắt đầu backfill P1...')

  // 1️⃣ Gán locked = false cho mọi ExamResult
  await prisma.examResult.updateMany({
    data: { locked: false },
  })

  // 2️⃣ Gán docHash tạm cho các certificate chưa có hash
  const certs = await prisma.certificate.findMany({
    where: {
      OR: [
        { docHash: { equals: '' } },
        // Prisma 6+ không chấp nhận null trực tiếp, nên ta dùng NOT
        { NOT: { docHash: { not: undefined } } },
      ],
    },
  })

  console.log(`🧾 Tìm thấy ${certs.length} chứng chỉ cần backfill`)

  for (const cert of certs) {
    await prisma.certificate.update({
      where: { id: cert.id },
      data: { docHash: '0x' + '0'.repeat(64) },
    })
  }

  console.log(`✅ Đã cập nhật ${certs.length} chứng chỉ.`)
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(() => prisma.$disconnect())
