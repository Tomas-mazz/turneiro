import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export type AdminSellerListItem = {
  id: string
  email: string
  name: string | null
  createdAt: string
  businessesCreatedCount: number
}

export async function listSellersForAdmin(): Promise<AdminSellerListItem[]> {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { businessesCreated: true } },
    },
  })

  return sellers.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    businessesCreatedCount: s._count.businessesCreated,
  }))
}

export async function createSellerForAdmin(input: {
  email: string
  password: string
  name?: string | null
}): Promise<{ id: string; email: string }> {
  const email = input.email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error('El email ya está registrado')
  }
  const hashed = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: 'SELLER',
      businessId: null,
      name: input.name?.trim() || null,
    },
    select: { id: true, email: true },
  })
  return user
}

export type AdminSellerDetail = {
  id: string
  email: string
  name: string | null
  createdAt: string
  businessesCreatedCount: number
  businesses: Array<{
    id: string
    name: string
    slug: string
    category: string
    createdAt: string
  }>
}

export async function getSellerDetailForAdmin(sellerId: string): Promise<AdminSellerDetail | null> {
  const seller = await prisma.user.findFirst({
    where: { id: sellerId, role: 'SELLER' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      businessesCreated: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          createdAt: true,
        },
      },
      _count: { select: { businessesCreated: true } },
    },
  })

  if (!seller) return null
  return {
    id: seller.id,
    email: seller.email,
    name: seller.name,
    createdAt: seller.createdAt.toISOString(),
    businessesCreatedCount: seller._count.businessesCreated,
    businesses: seller.businessesCreated.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      createdAt: b.createdAt.toISOString(),
    })),
  }
}

