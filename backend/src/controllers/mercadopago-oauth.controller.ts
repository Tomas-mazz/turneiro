import { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/auth'
import type { BusinessContextRequest } from '../middleware/businessContext'
import {
  buildFrontendRedirect,
  connectBusinessFromAuthorizationCode,
  disconnectMercadoPagoBusiness,
  getMercadoPagoOAuthUrl,
  getReturnUrlFromState,
} from '../services/mercadopago-oauth.service'
import { prisma } from '../lib/prisma'

export async function initiateMercadoPagoOAuth(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const businessId = (req as BusinessContextRequest).businessContext?.businessId
    if (!businessId) {
      return res.status(403).json({ error: 'No tienes un negocio asignado' })
    }

    const returnUrl =
      typeof req.query.returnUrl === 'string' ? req.query.returnUrl : undefined

    const authUrl = getMercadoPagoOAuthUrl({
      businessId,
      userId: req.user.userId,
      returnUrl,
    })

    return res.json({ authUrl })
  } catch (error) {
    console.error('initiateMercadoPagoOAuth error:', error)
    return res.status(500).json({ error: 'Error al iniciar conexión con Mercado Pago' })
  }
}

export async function mercadoPagoOAuthCallback(req: Request, res: Response) {
  const state = typeof req.query.state === 'string' ? req.query.state : undefined
  let returnUrl: string | undefined

  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined
    if (state) {
      returnUrl = getReturnUrlFromState(state)
    }

    if (!code || !state) {
      return res.redirect(
        buildFrontendRedirect(returnUrl, { mercado_pago_error: 'missing_code' })
      )
    }

    const connected = await connectBusinessFromAuthorizationCode({ code, state })
    return res.redirect(
      buildFrontendRedirect(connected.returnUrl, { mercado_pago: 'connected' })
    )
  } catch (error) {
    console.error('mercadoPagoOAuthCallback error:', error)
    return res.redirect(
      buildFrontendRedirect(returnUrl, { mercado_pago_error: 'oauth_failed' })
    )
  }
}

export async function disconnectMercadoPagoOAuth(req: AuthRequest, res: Response) {
  try {
    const businessId = (req as BusinessContextRequest).businessContext?.businessId
    if (!businessId) {
      return res.status(403).json({ error: 'No tienes un negocio asignado' })
    }

    await disconnectMercadoPagoBusiness(businessId)
    return res.json({ success: true })
  } catch (error) {
    console.error('disconnectMercadoPagoOAuth error:', error)
    return res.status(500).json({ error: 'Error al desconectar Mercado Pago' })
  }
}

export async function getMercadoPagoOAuthStatus(req: AuthRequest, res: Response) {
  try {
    const businessId = (req as BusinessContextRequest).businessContext?.businessId
    if (!businessId) {
      return res.status(403).json({ error: 'No tienes un negocio asignado' })
    }

    const settings = await prisma.businessSettings.findUnique({
      where: { businessId },
      select: {
        mercadoPagoAccessToken: true,
        mercadoPagoRefreshToken: true,
        mercadoPagoUserId: true,
        mercadoPagoConnectedAt: true,
        mercadoPagoTokenExpiresAt: true,
      },
    })

    return res.json({
      connected: !!settings?.mercadoPagoAccessToken,
      connectionType: settings?.mercadoPagoRefreshToken ? 'OAUTH' : settings?.mercadoPagoAccessToken ? 'MANUAL' : null,
      accountId: settings?.mercadoPagoUserId ?? null,
      connectedAt: settings?.mercadoPagoConnectedAt ?? null,
      tokenExpiresAt: settings?.mercadoPagoTokenExpiresAt ?? null,
    })
  } catch (error) {
    console.error('getMercadoPagoOAuthStatus error:', error)
    return res.status(500).json({ error: 'Error al obtener estado de Mercado Pago' })
  }
}
