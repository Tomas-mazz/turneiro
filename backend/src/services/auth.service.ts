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
