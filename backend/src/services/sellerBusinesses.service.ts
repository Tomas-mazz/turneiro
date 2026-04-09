import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'
import { ensureOwnerEmployee } from './ownerEmployee.service'

const BUTTON_COLOR_DARK_THEME = '#f5f5f5'
const BUTTON_COLOR_LIGHT_THEME = '#171717'

export type SellerBusinessListItem = {
  id: string
  name: string
  slug: string
  category: string
  email: string | null
  phone: string | null
  createdAt: string
  appointmentsCount: number
}

export async function listBusinessesForSeller(sellerUserId: string): Promise<SellerBusinessListItem[]> {
  const businesses = await prisma.business.findMany({
    where: { createdBySellerId: sellerUserId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { appointments: true } },
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
    appointmentsCount: b._count.appointments,
  }))
}

export type SellerBusinessDetail = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logo: string | null
  coverPhoto: string | null
  coverVideo: string | null
  coverPhotoMobile: string | null
  coverVideoMobile: string | null
  theme: 'DARK' | 'LIGHT'
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  owner: { id: string; email: string } | null
}

export async function getBusinessForSeller(
  sellerUserId: string,
  businessId: string
): Promise<SellerBusinessDetail | null> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, createdBySellerId: sellerUserId },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      logo: true,
      coverPhoto: true,
      coverVideo: true,
      coverPhotoMobile: true,
      coverVideoMobile: true,
      theme: true,
      phone: true,
      email: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      users: {
        where: { role: 'OWNER' },
        take: 1,
        select: { id: true, email: true },
      },
    } as Prisma.BusinessSelect,
  })

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
    coverPhotoMobile: business.coverPhotoMobile,
    coverVideoMobile: business.coverVideoMobile,
    theme: (business.theme as 'DARK' | 'LIGHT') ?? 'DARK',
    phone: business.phone,
    email: business.email,
    address: business.address,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    owner,
  }
}

export type CreateBusinessForSellerInput = {
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
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
  theme?: 'DARK' | 'LIGHT'
  ownerEmail?: string
  ownerPassword?: string
}

export async function createBusinessForSeller(
  sellerUserId: string,
  input: CreateBusinessForSellerInput
): Promise<{ id: string; slug: string }> {
  const slug = input.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const finalSlug = slug || input.slug

  const existing = await prisma.business.findUnique({ where: { slug: finalSlug } })
  if (existing) throw new Error('Ya existe un negocio con ese slug')

  const business = await prisma.$transaction(async (tx) => {
    const theme = input.theme ?? 'DARK'
    const b = await tx.business.create({
      data: {
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
        coverPhotoMobile:
          input.coverPhotoMobile && input.coverPhotoMobile.trim() ? input.coverPhotoMobile.trim() : null,
        coverVideoMobile:
          input.coverVideoMobile && input.coverVideoMobile.trim() ? input.coverVideoMobile.trim() : null,
        theme,
        primaryColor: theme === 'LIGHT' ? BUTTON_COLOR_LIGHT_THEME : BUTTON_COLOR_DARK_THEME,
        createdBySellerId: sellerUserId,
      },
      select: { id: true, slug: true },
    })

    // Keep settings default and paymentRequired OFF for seller-created businesses.
    await tx.businessSettings.create({
      data: {
        businessId: b.id,
        paymentRequired: false,
        paymentOptionalEnabled: false,
        paymentType: null,
        depositPercentage: null,
        requireRegistrationBeforePayment: true,
        freeCancellationWindow: 24,
        cancellationHasCost: false,
        bufferTime: null,
        slotIntervalMinutes: 15,
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

    // Ensure the owner profile exists even if owner credentials are added later.
    await ensureOwnerEmployee(tx, b.id, { fallbackName: input.name })

    if (
      input.ownerEmail &&
      input.ownerEmail.trim() &&
      input.ownerPassword &&
      input.ownerPassword.length >= 6
    ) {
      const ownerEmail = input.ownerEmail.trim().toLowerCase()
      const existingUser = await tx.user.findUnique({ where: { email: ownerEmail } })
      if (existingUser) {
        throw new Error(
          'Ese email ya está registrado (admin u otro negocio). Usá otro email para el dueño de este negocio.'
        )
      }
      const hashed = await bcrypt.hash(input.ownerPassword, 10)
      const ownerUser = await tx.user.create({
        data: {
          email: ownerEmail,
          password: hashed,
          role: 'OWNER',
          businessId: b.id,
        },
        select: { id: true },
      })
      await ensureOwnerEmployee(tx, b.id, { ownerUserId: ownerUser.id, fallbackName: input.name })
    }

    return b
  })

  return { id: business.id, slug: business.slug }
}

export type UpdateBusinessForSellerInput = {
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
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
  theme?: 'DARK' | 'LIGHT'
  ownerEmail?: string
  ownerPassword?: string
}

export async function updateBusinessForSeller(
  sellerUserId: string,
  businessId: string,
  input: UpdateBusinessForSellerInput
): Promise<void> {
  const existing = await prisma.business.findFirst({
    where: { id: businessId, createdBySellerId: sellerUserId },
    include: { users: { where: { role: 'OWNER' }, take: 1 } },
  })
  if (!existing) throw new Error('Negocio no encontrado')

  if (input.slug !== undefined && input.slug !== existing.slug) {
    const slugTaken = await prisma.business.findFirst({
      where: { slug: input.slug, id: { not: businessId } },
    })
    if (slugTaken) throw new Error('Ya existe un negocio con ese slug')
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
    if (input.coverPhotoMobile !== undefined) updateData.coverPhotoMobile = input.coverPhotoMobile && input.coverPhotoMobile.trim() ? input.coverPhotoMobile.trim() : null
    if (input.coverVideoMobile !== undefined) updateData.coverVideoMobile = input.coverVideoMobile && input.coverVideoMobile.trim() ? input.coverVideoMobile.trim() : null
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

    const ownerEmail =
      input.ownerEmail !== undefined && input.ownerEmail.trim()
        ? input.ownerEmail.trim().toLowerCase()
        : null
    const ownerPassword =
      input.ownerPassword && input.ownerPassword.length >= 6 ? input.ownerPassword : null

    if (ownerEmail || ownerPassword) {
      const owner = existing.users[0]
      if (owner) {
        const updateUser: { password?: string; email?: string } = {}
        if (ownerPassword) updateUser.password = await bcrypt.hash(ownerPassword, 10)
        if (ownerEmail && ownerEmail !== owner.email) {
          const emailTaken = await tx.user.findFirst({
            where: { email: ownerEmail, id: { not: owner.id } },
          })
          if (emailTaken) throw new Error('El email del owner ya está en uso')
          updateUser.email = ownerEmail
        }
        if (Object.keys(updateUser).length > 0) {
          await tx.user.update({ where: { id: owner.id }, data: updateUser })
        }
        await ensureOwnerEmployee(tx, businessId, { ownerUserId: owner.id })
      } else if (ownerEmail && ownerPassword) {
        const emailTaken = await tx.user.findUnique({ where: { email: ownerEmail } })
        if (emailTaken) throw new Error('El email del owner ya está en uso')
        const hashed = await bcrypt.hash(ownerPassword, 10)
        const ownerUser = await tx.user.create({
          data: {
            email: ownerEmail,
            password: hashed,
            role: 'OWNER',
            businessId,
          },
          select: { id: true },
        })
        await ensureOwnerEmployee(tx, businessId, { ownerUserId: ownerUser.id })
      }
    }
  })
}

