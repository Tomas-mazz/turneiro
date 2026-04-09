import type { Prisma } from '@prisma/client'

/**
 * Ensure a business has an owner Employee (isOwner=true).
 * When ownerUserId is provided, it links employee.userId (one-to-one) if possible.
 */
export async function ensureOwnerEmployee(
  tx: Prisma.TransactionClient,
  businessId: string,
  options?: { ownerUserId?: string; fallbackName?: string }
): Promise<void> {
  const existing = await tx.employee.findFirst({
    where: { businessId, isOwner: true },
    select: { id: true, userId: true },
  })
  if (existing) {
    if (options?.ownerUserId && !existing.userId) {
      await tx.employee.update({
        where: { id: existing.id },
        data: { userId: options.ownerUserId },
      })
    }
    return
  }

  await tx.employee.create({
    data: {
      businessId,
      name: options?.fallbackName?.trim() || 'Dueño',
      isOwner: true,
      userId: options?.ownerUserId,
    },
  })
}

