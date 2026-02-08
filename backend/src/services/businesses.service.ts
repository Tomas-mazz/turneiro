import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

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

export interface AdminBusinessListItem {
  id: string
  name: string
  slug: string
  category: string
  email: string | null
  phone: string | null
  createdAt: string
  servicesCount: number
  appointmentsCount: number
}

/**
 * List all businesses for admin panel.
 */
export async function getAllBusinessesForAdmin(): Promise<AdminBusinessListItem[]> {
  const businesses = await prisma.business.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          services: true,
          appointments: true,
        },
      },
    },
  })

  return businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    category: b.category,
    email: b.email,
    phone: b.phone,
    createdAt: b.createdAt.toISOString(),
    servicesCount: b._count.services,
    appointmentsCount: b._count.appointments,
  }))
}

const BUTTON_COLOR_DARK_THEME = '#f5f5f5'
const BUTTON_COLOR_LIGHT_THEME = '#171717'

export interface AdminBusinessDetail {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logo: string | null
  coverPhoto: string | null
  coverVideo: string | null
  theme: string
  primaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  settings: {
    paymentRequired: boolean
    paymentType: string | null
    depositPercentage: number | null
    freeCancellationWindow: number | null
    cancellationHasCost: boolean
    lateCancellationFee: number | null
    bufferTime: number | null
  } | null
  owner: { id: string; email: string } | null
}

/** Shape returned by getBusinessByIdForAdmin query (schema has theme, coverVideo, settings, users). */
type BusinessByIdAdminRow = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logo: string | null
  coverPhoto: string | null
  coverVideo: string | null
  theme: string
  primaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
  settings: {
    paymentRequired: boolean
    paymentType: string | null
    depositPercentage: number | null
    freeCancellationWindow: number | null
    cancellationHasCost: boolean
    lateCancellationFee: number | null
    bufferTime: number | null
  } | null
  users: { id: string; email: string }[]
}

/**
 * Get single business by id for admin edit form.
 */
export async function getBusinessByIdForAdmin(
  businessId: string
): Promise<AdminBusinessDetail | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      logo: true,
      coverPhoto: true,
      coverVideo: true,
      theme: true,
      primaryColor: true,
      phone: true,
      email: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      settings: {
        select: {
          paymentRequired: true,
          paymentType: true,
          depositPercentage: true,
          freeCancellationWindow: true,
          cancellationHasCost: true,
          lateCancellationFee: true,
          bufferTime: true,
        },
      },
      users: {
        where: { role: 'OWNER' },
        take: 1,
        select: { id: true, email: true },
      },
    } as Prisma.BusinessSelect,
  }) as BusinessByIdAdminRow | null

  if (!business) return null

  const owner = business.users[0] ?? null
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    category: business.category,
    description: business.description,
    logo: business.logo,
    coverPhoto: business.coverPhoto,
    coverVideo: business.coverVideo,
    theme: business.theme ?? 'DARK',
    primaryColor: business.primaryColor,
    phone: business.phone,
    email: business.email,
    address: business.address,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    settings: business.settings,
    owner,
  }
}

export interface CreateBusinessForAdminInput {
  name: string
  slug: string
  category: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: string | null
  coverPhoto?: string | null
  coverVideo?: string | null
  theme?: 'DARK' | 'LIGHT'
  paymentRequired: boolean
  ownerEmail?: string
  ownerPassword?: string
}

/**
 * Create business + settings + optional owner + default working hours (all closed).
 */
export async function createBusinessForAdmin(
  input: CreateBusinessForAdminInput
): Promise<{ id: string; slug: string }> {
  const slug = input.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const finalSlug = slug || input.slug

  const existing = await prisma.business.findUnique({
    where: { slug: finalSlug },
  })
  if (existing) {
    throw new Error('Ya existe un negocio con ese slug')
  }

  const business = await prisma.$transaction(async (tx) => {
    const createData = {
      name: input.name,
      slug: finalSlug,
      category: input.category,
      description: input.description ?? null,
      phone: input.phone ?? null,
      email: input.email && input.email.trim() ? input.email.trim() : null,
      address: input.address ?? null,
      logo: input.logo && input.logo.trim() ? input.logo.trim() : null,
      coverPhoto: input.coverPhoto && input.coverPhoto.trim() ? input.coverPhoto.trim() : null,
      coverVideo: input.coverVideo && input.coverVideo.trim() ? input.coverVideo.trim() : null,
      theme: input.theme ?? 'DARK',
      primaryColor: input.theme === 'LIGHT' ? BUTTON_COLOR_LIGHT_THEME : BUTTON_COLOR_DARK_THEME,
    }
    const b = await tx.business.create({ data: createData as Prisma.BusinessCreateInput })

    await tx.businessSettings.create({
      data: {
        businessId: b.id,
        paymentRequired: input.paymentRequired,
        paymentType: input.paymentRequired ? 'FULL' : null,
        depositPercentage: null,
        requireRegistrationBeforePayment: true,
        freeCancellationWindow: 24,
        cancellationHasCost: false,
        bufferTime: null,
      },
    })

    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      await tx.workingHours.create({
        data: {
          businessId: b.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          isClosed: true,
        },
      })
    }

    if (
      input.ownerEmail &&
      input.ownerEmail.trim() &&
      input.ownerPassword &&
      input.ownerPassword.length >= 6
    ) {
      const hashed = await bcrypt.hash(input.ownerPassword, 10)
      const existingUser = await tx.user.findUnique({
        where: { email: input.ownerEmail.trim().toLowerCase() },
      })
      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashed,
            businessId: b.id,
            role: 'OWNER',
          },
        })
      } else {
        await tx.user.create({
          data: {
            email: input.ownerEmail.trim().toLowerCase(),
            password: hashed,
            role: 'OWNER',
            businessId: b.id,
          },
        })
      }
    }

    return b
  })

  return { id: business.id, slug: business.slug }
}

export interface UpdateBusinessForAdminInput {
  name?: string
  slug?: string
  category?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: string | null
  coverPhoto?: string | null
  coverVideo?: string | null
  theme?: 'DARK' | 'LIGHT'
  paymentRequired?: boolean
  paymentType?: 'PERCENTAGE' | 'FULL'
  depositPercentage?: number | null
  freeCancellationWindow?: number | null
  cancellationHasCost?: boolean
  lateCancellationFee?: number | null
  bufferTime?: number | null
  ownerEmail?: string
  ownerPassword?: string
}

/**
 * Update business, settings (paymentRequired), and optionally owner credentials.
 */
export async function updateBusinessForAdmin(
  businessId: string,
  input: UpdateBusinessForAdminInput
): Promise<void> {
  const existing = await prisma.business.findUnique({
    where: { id: businessId },
    include: { settings: true, users: { where: { role: 'OWNER' }, take: 1 } },
  })
  if (!existing) {
    throw new Error('Negocio no encontrado')
  }

  if (input.slug !== undefined && input.slug !== existing.slug) {
    const slugTaken = await prisma.business.findFirst({
      where: { slug: input.slug, id: { not: businessId } },
    })
    if (slugTaken) {
      throw new Error('Ya existe un negocio con ese slug')
    }
  }

  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.slug !== undefined) updateData.slug = input.slug.toLowerCase()
    if (input.category !== undefined) updateData.category = input.category
    if (input.description !== undefined) updateData.description = input.description
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.email !== undefined) updateData.email = input.email && input.email.trim() ? input.email.trim() : null
    if (input.address !== undefined) updateData.address = input.address
    if (input.logo !== undefined) updateData.logo = input.logo && input.logo.trim() ? input.logo.trim() : null
    if (input.coverPhoto !== undefined) updateData.coverPhoto = input.coverPhoto && input.coverPhoto.trim() ? input.coverPhoto.trim() : null
    if (input.coverVideo !== undefined) updateData.coverVideo = input.coverVideo && input.coverVideo.trim() ? input.coverVideo.trim() : null
    if (input.theme !== undefined) {
      updateData.theme = input.theme
      updateData.primaryColor = input.theme === 'LIGHT' ? BUTTON_COLOR_LIGHT_THEME : BUTTON_COLOR_DARK_THEME
    }

    if (Object.keys(updateData).length > 0) {
      await tx.business.update({
        where: { id: businessId },
        data: updateData as Prisma.BusinessUpdateInput,
      })
    }

    const hasSettingsInput =
      input.paymentRequired !== undefined ||
      input.paymentType !== undefined ||
      input.depositPercentage !== undefined ||
      input.freeCancellationWindow !== undefined ||
      input.cancellationHasCost !== undefined ||
      input.lateCancellationFee !== undefined ||
      input.bufferTime !== undefined

    if (hasSettingsInput) {
      const existingSettings = existing.settings
      const paymentRequired =
        input.paymentRequired ?? existingSettings?.paymentRequired ?? false
      const paymentType =
        input.paymentType ??
        existingSettings?.paymentType ??
        (paymentRequired ? 'FULL' : null)
      const depositPercentage =
        input.depositPercentage !== undefined
          ? input.depositPercentage
          : existingSettings?.depositPercentage ?? null
      const freeCancellationWindow =
        input.freeCancellationWindow !== undefined
          ? input.freeCancellationWindow
          : existingSettings?.freeCancellationWindow ?? 24
      const cancellationHasCost =
        input.cancellationHasCost ?? existingSettings?.cancellationHasCost ?? false
      const lateCancellationFee =
        input.lateCancellationFee !== undefined
          ? input.lateCancellationFee
          : existingSettings?.lateCancellationFee ?? null
      const bufferTime =
        input.bufferTime !== undefined
          ? input.bufferTime
          : existingSettings?.bufferTime ?? null

      await tx.businessSettings.upsert({
        where: { businessId },
        create: {
          businessId,
          paymentRequired,
          paymentType: paymentRequired ? paymentType : null,
          depositPercentage: paymentType === 'PERCENTAGE' ? depositPercentage : null,
          requireRegistrationBeforePayment: true,
          freeCancellationWindow,
          cancellationHasCost,
          lateCancellationFee,
          bufferTime,
        },
        update: {
          paymentRequired,
          paymentType: paymentRequired ? paymentType : null,
          depositPercentage: paymentType === 'PERCENTAGE' ? depositPercentage : null,
          freeCancellationWindow,
          cancellationHasCost,
          lateCancellationFee,
          bufferTime,
        },
      })
    }

    const ownerEmail =
      input.ownerEmail !== undefined && input.ownerEmail.trim()
        ? input.ownerEmail.trim().toLowerCase()
        : null
    const ownerPassword = input.ownerPassword && input.ownerPassword.length >= 6 ? input.ownerPassword : null

    if (ownerEmail || ownerPassword) {
      const owner = existing.users[0]
      if (owner) {
        const updateUser: { password?: string; email?: string } = {}
        if (ownerPassword) {
          updateUser.password = await bcrypt.hash(ownerPassword, 10)
        }
        if (ownerEmail && ownerEmail !== owner.email) {
          const emailTaken = await tx.user.findFirst({
            where: { email: ownerEmail, id: { not: owner.id } },
          })
          if (emailTaken) throw new Error('El email del owner ya está en uso')
          updateUser.email = ownerEmail
        }
        if (Object.keys(updateUser).length > 0) {
          await tx.user.update({
            where: { id: owner.id },
            data: updateUser,
          })
        }
      } else if (ownerEmail && ownerPassword) {
        const emailTaken = await tx.user.findUnique({
          where: { email: ownerEmail },
        })
        if (emailTaken) throw new Error('El email del owner ya está en uso')
        const hashed = await bcrypt.hash(ownerPassword, 10)
        await tx.user.create({
          data: {
            email: ownerEmail,
            password: hashed,
            role: 'OWNER',
            businessId,
          },
        })
      }
    }
  })
}

/**
 * Admin: delete a business and all related data (cascade: users, appointments, services, workingHours, blockedSlots, settings, subscription, employees).
 */
export async function deleteBusinessForAdmin(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })
  if (!business) {
    throw new Error('Negocio no encontrado')
  }
  await prisma.business.delete({
    where: { id: businessId },
  })
}
