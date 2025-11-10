import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function logAudit({
  actorId,
  action,
  entity,
  entityId,
  payload,
}: {
  actorId?: number
  action: string
  entity?: string
  entityId?: string
  payload?: any
}) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      payload,
    },
  })
}
