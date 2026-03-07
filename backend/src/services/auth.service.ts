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

  if (!user.password) {
    throw new AuthError('Esta cuenta usa inicio de sesión con Google. Usá ese botón para entrar.')
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
      name: user.name,
    },
  }
}

export async function registerService(data: {
  name: string
  email: string
  password: string
  businessSlug: string
}) {
  const emailLower = data.email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  })
  if (existing) {
    throw new AuthError('El email ya está registrado')
  }

  const business = await prisma.business.findUnique({
    where: { slug: data.businessSlug },
  })
  if (!business) {
    throw new AuthError('Negocio no encontrado')
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      name: data.name.trim() || null,
      email: emailLower,
      password: hashedPassword,
      role: 'USER',
      businessId: business.id,
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
      name: user.name,
    },
  }
}

/** Google OAuth: exchange code for tokens, get profile, find or create user for the store (state = businessSlug). */
export async function googleOAuthService(data: {
  code: string
  redirectUri: string
  state: string // businessSlug
}) {
  const { code, redirectUri, state: businessSlug } = data
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new AuthError('Login con Google no está configurado')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new AuthError('Error al conectar con Google. Intentá de nuevo.')
  }
  const tokens = (await tokenRes.json()) as { access_token: string }
  const accessToken = tokens.access_token
  if (!accessToken) {
    throw new AuthError('Google no devolvió un token válido')
  }

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!userInfoRes.ok) {
    throw new AuthError('No se pudo obtener tu perfil de Google')
  }
  const profile = (await userInfoRes.json()) as { email: string; name?: string }
  const emailLower = (profile.email || '').toLowerCase().trim()
  if (!emailLower) {
    throw new AuthError('Google no proporcionó tu email')
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  })
  if (!business) {
    throw new AuthError('Negocio no encontrado')
  }

  let user = await prisma.user.findUnique({
    where: { email: emailLower },
  })
  if (user) {
    if (user.businessId !== business.id) {
      throw new AuthError('Este email ya está registrado en otra tienda. Iniciá sesión con email y contraseña allí.')
    }
    if (!user.password) {
      if (profile.name && profile.name.trim() && profile.name.trim() !== user.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: profile.name.trim() },
        })
      }
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: emailLower,
        name: (profile.name || '').trim() || null,
        password: null,
        role: 'USER',
        businessId: business.id,
      },
    })
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
      name: user.name,
    },
  }
}

/** Return current user by userId from JWT (for GET /auth/me). */
export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, businessId: true, name: true },
  })
  if (!user) return null
  return user
}
