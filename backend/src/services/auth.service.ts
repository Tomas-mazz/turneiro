import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'

const SALT_ROUNDS = 10

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function registerService(data: {
  email: string
  password: string
  role?: string
  businessId?: string | null
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })
  if (existing) {
    throw new AuthError('El email ya está registrado')
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role ?? 'OWNER',
      businessId: data.businessId ?? null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      businessId: true,
      createdAt: true,
    },
  })

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId ?? undefined,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    },
  }
}

export async function loginService(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })
  if (!user) {
    throw new AuthError('Email o contraseña incorrectos')
  }

  const valid = await bcrypt.compare(data.password, user.password)
  if (!valid) {
    throw new AuthError('Email o contraseña incorrectos')
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId ?? undefined,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    },
  }
}
