import crypto from 'crypto'
import { prisma } from '../lib/prisma'

const MERCADOPAGO_AUTH_URL = 'https://auth.mercadopago.com/authorization'
const MERCADOPAGO_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000
const DEFAULT_RETURN_URL = '/setting/payments'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

type OAuthStatePayload = {
  businessId: string
  userId: string
  returnUrl: string
  expiresAt: number
  nonce: string
}

type MercadoPagoTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  public_key?: string
  user_id?: string | number
}

type MercadoPagoCredentialSettings = {
  id?: string
  businessId?: string
  mercadoPagoAccessToken: string | null
  mercadoPagoRefreshToken?: string | null
  mercadoPagoTokenExpiresAt?: Date | null
  mercadoPagoPublicKey?: string | null
  mercadoPagoUserId?: string | null
}

function requireMercadoPagoOAuthConfig(): {
  clientId: string
  clientSecret: string
  redirectUri: string
} {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim()
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim()
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI?.trim()

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Mercado Pago OAuth no configurado: faltan MERCADOPAGO_CLIENT_ID, MERCADOPAGO_CLIENT_SECRET o MERCADOPAGO_REDIRECT_URI'
    )
  }

  return { clientId, clientSecret, redirectUri }
}

function stateSecret(): string {
  const secret =
    process.env.MERCADOPAGO_OAUTH_STATE_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.MERCADOPAGO_CLIENT_SECRET?.trim()

  if (!secret) {
    throw new Error('Mercado Pago OAuth no configurado: falta secreto para firmar state')
  }

  return secret
}

function signStatePayload(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', stateSecret())
    .update(encodedPayload)
    .digest('base64url')
}

function sanitizeReturnUrl(raw?: string | null): string {
  const value = raw?.trim()
  if (!value) return DEFAULT_RETURN_URL

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  try {
    const url = new URL(value)
    const frontendHost = new URL(FRONTEND_URL).hostname
    const hostname = url.hostname
    const allowed =
      hostname === frontendHost ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === 'turneiro.com' ||
      hostname.endsWith('.turneiro.com')

    return allowed ? url.toString() : DEFAULT_RETURN_URL
  } catch {
    return DEFAULT_RETURN_URL
  }
}

function encodeState(payload: OAuthStatePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${signStatePayload(encodedPayload)}`
}

function decodeState(state: string): OAuthStatePayload {
  const [encodedPayload, signature] = state.split('.')
  if (!encodedPayload || !signature) {
    throw new Error('Mercado Pago OAuth state inválido')
  }

  const expected = signStatePayload(encodedPayload)
  const receivedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new Error('Mercado Pago OAuth state inválido')
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as OAuthStatePayload
  if (!payload.businessId || !payload.userId || payload.expiresAt < Date.now()) {
    throw new Error('Mercado Pago OAuth state expirado')
  }

  return {
    ...payload,
    returnUrl: sanitizeReturnUrl(payload.returnUrl),
  }
}

function tokenExpiresAt(expiresIn?: number): Date | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null
  return new Date(Date.now() + expiresIn * 1000)
}

async function requestToken(body: Record<string, string>): Promise<MercadoPagoTokenResponse> {
  const response = await fetch(MERCADOPAGO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    console.error('Mercado Pago OAuth token error:', response.status, details)
    throw new Error('No se pudo conectar Mercado Pago')
  }

  const data = (await response.json()) as MercadoPagoTokenResponse
  if (!data.access_token) {
    throw new Error('Mercado Pago no devolvió access token')
  }

  return data
}

export function getMercadoPagoOAuthUrl(params: {
  businessId: string
  userId: string
  returnUrl?: string | null
}): string {
  const { clientId, redirectUri } = requireMercadoPagoOAuthConfig()
  const state = encodeState({
    businessId: params.businessId,
    userId: params.userId,
    returnUrl: sanitizeReturnUrl(params.returnUrl),
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex'),
  })

  const url = new URL(MERCADOPAGO_AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('platform_id', 'mp')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', 'offline_access')
  return url.toString()
}

export function getReturnUrlFromState(state: string): string {
  return decodeState(state).returnUrl
}

export function buildFrontendRedirect(
  returnUrl: string | undefined,
  params: Record<string, string>
): string {
  const safeReturnUrl = sanitizeReturnUrl(returnUrl)
  const redirect = new URL(
    safeReturnUrl.startsWith('http') ? safeReturnUrl : `${FRONTEND_URL}${safeReturnUrl}`
  )
  Object.entries(params).forEach(([key, value]) => redirect.searchParams.set(key, value))
  return redirect.toString()
}

export async function connectBusinessFromAuthorizationCode(params: {
  code: string
  state: string
}): Promise<{ businessId: string; returnUrl: string }> {
  const { clientId, clientSecret, redirectUri } = requireMercadoPagoOAuthConfig()
  const state = decodeState(params.state)
  const token = await requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: redirectUri,
  })

  if (!token.refresh_token) {
    throw new Error('Mercado Pago no devolvió refresh token')
  }

  await prisma.businessSettings.upsert({
    where: { businessId: state.businessId },
    create: {
      businessId: state.businessId,
      mercadoPagoAccessToken: token.access_token ?? null,
      mercadoPagoRefreshToken: token.refresh_token ?? null,
      mercadoPagoTokenExpiresAt: tokenExpiresAt(token.expires_in),
      mercadoPagoPublicKey: token.public_key ?? null,
      mercadoPagoUserId: token.user_id != null ? String(token.user_id) : null,
      mercadoPagoConnectedAt: new Date(),
      requireRegistrationBeforePayment: true,
    },
    update: {
      mercadoPagoAccessToken: token.access_token ?? null,
      mercadoPagoRefreshToken: token.refresh_token ?? null,
      mercadoPagoTokenExpiresAt: tokenExpiresAt(token.expires_in),
      ...(token.public_key !== undefined && { mercadoPagoPublicKey: token.public_key ?? null }),
      mercadoPagoUserId: token.user_id != null ? String(token.user_id) : null,
      mercadoPagoConnectedAt: new Date(),
    },
  })

  return { businessId: state.businessId, returnUrl: state.returnUrl }
}

async function refreshBusinessToken(
  businessId: string,
  refreshToken: string
): Promise<string> {
  const { clientId, clientSecret } = requireMercadoPagoOAuthConfig()
  const token = await requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  await prisma.businessSettings.update({
    where: { businessId },
    data: {
      mercadoPagoAccessToken: token.access_token ?? null,
      mercadoPagoRefreshToken: token.refresh_token ?? refreshToken,
      mercadoPagoTokenExpiresAt: tokenExpiresAt(token.expires_in),
      ...(token.public_key !== undefined && { mercadoPagoPublicKey: token.public_key ?? null }),
      ...(token.user_id != null && { mercadoPagoUserId: String(token.user_id) }),
    },
  })

  return token.access_token!
}

export async function getValidMercadoPagoAccessTokenForBusiness(
  businessId: string,
  settings?: MercadoPagoCredentialSettings | null
): Promise<string | null> {
  const credentials =
    settings ??
    (await prisma.businessSettings.findUnique({
      where: { businessId },
      select: {
        mercadoPagoAccessToken: true,
        mercadoPagoRefreshToken: true,
        mercadoPagoTokenExpiresAt: true,
      },
    }))

  if (!credentials?.mercadoPagoAccessToken) return null

  const refreshToken = credentials.mercadoPagoRefreshToken?.trim()
  const expiresAt = credentials.mercadoPagoTokenExpiresAt
  const shouldRefresh =
    !!refreshToken && !!expiresAt && expiresAt.getTime() <= Date.now() + TOKEN_REFRESH_SKEW_MS

  if (!shouldRefresh) {
    return credentials.mercadoPagoAccessToken
  }

  return refreshBusinessToken(businessId, refreshToken)
}

export async function listValidMercadoPagoAccessTokens(): Promise<string[]> {
  const rows = await prisma.businessSettings.findMany({
    where: { mercadoPagoAccessToken: { not: null } },
    select: {
      businessId: true,
      mercadoPagoAccessToken: true,
      mercadoPagoRefreshToken: true,
      mercadoPagoTokenExpiresAt: true,
    },
  })

  const resolved = await Promise.all(
    rows.map((row) =>
      getValidMercadoPagoAccessTokenForBusiness(row.businessId, row).catch(() => row.mercadoPagoAccessToken)
    )
  )

  return Array.from(
    new Set(
      [
        process.env.MERCADOPAGO_ACCESS_TOKEN ?? null,
        ...resolved,
      ].filter((token): token is string => !!token && token.trim().length > 0)
    )
  )
}

export async function disconnectMercadoPagoBusiness(businessId: string): Promise<void> {
  await prisma.businessSettings.update({
    where: { businessId },
    data: {
      mercadoPagoAccessToken: null,
      mercadoPagoRefreshToken: null,
      mercadoPagoTokenExpiresAt: null,
      mercadoPagoPublicKey: null,
      mercadoPagoUserId: null,
      mercadoPagoConnectedAt: null,
    },
  })
}
