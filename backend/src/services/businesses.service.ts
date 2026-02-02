import { prisma } from '../lib/prisma'

export interface MyBusinessInfo {
  name: string
  slug: string
}

/**
 * Get current user's business name and slug (for dashboard header).
 */
export async function getMyBusinessService(
  businessId: string
): Promise<MyBusinessInfo | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, slug: true },
  })
  return business
}

/**
 * Public business profile by slug (for booking page).
 * Returns business with active services and working hours.
 * Returns null if not found.
 */
export async function getBusinessBySlugService(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
        },
      },
      workingHours: {
        orderBy: { dayOfWeek: 'asc' },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          lunchStart: true,
          lunchEnd: true,
          isClosed: true,
        },
      },
      settings: {
        select: {
          paymentRequired: true,
          paymentType: true,
          depositPercentage: true,
        },
      },
      employees: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
        },
      },
    },
  })

  return business
}
