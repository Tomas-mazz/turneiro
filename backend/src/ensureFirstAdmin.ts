import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma'

/**
 * On first deploy (no admin users yet), create one admin from env vars.
 * Only runs when INIT_ADMIN_EMAIL and INIT_ADMIN_PASSWORD are set.
 */
export async function ensureFirstAdmin(): Promise<void> {
  const email = process.env.INIT_ADMIN_EMAIL?.trim()
  const password = process.env.INIT_ADMIN_PASSWORD

  if (!email || !password) {
    return
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (existingAdmin) {
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const normalizedEmail = email.toLowerCase()

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      role: 'ADMIN',
      businessId: null,
    },
  })

  console.log('[ensureFirstAdmin] First admin created:', normalizedEmail)
}
