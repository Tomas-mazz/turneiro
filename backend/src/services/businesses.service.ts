import { prisma } from '../lib/prisma'

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
    },
  })

  return business
}
