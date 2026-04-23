import { Request, Response, NextFunction } from 'express'
import {
  getBusinessBySlugService,
  getMyBusinessService,
  getBusinessImagesService,
  updateBusinessImagesService,
  getBusinessSettingsService,
  updateBusinessSettingsService,
} from '../services/businesses.service'
import {
  getMyProfileService,
  updateMyProfileService,
} from '../services/employees.service'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import { getBusinessCapabilities } from '../lib/industryCapabilities'

/** Accepts `#RRGGBB` or `RRGGBB`. Undefined = omit, null/'' = clear to default. */
function parseOptionalPublicPageBackgroundHex(
  v: unknown
): { ok: true; value: string | null | undefined } | { ok: false } {
  if (v === undefined) return { ok: true, value: undefined }
  if (v === null || v === '') return { ok: true, value: null }
  const s = String(v).trim()
  const h = s.startsWith('#') ? s : `#${s}`
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return { ok: false }
  return { ok: true, value: h.toUpperCase() }
}

function parseOptionalBrandIntensity(
  v: unknown
): { ok: true; value: 'SOFT' | 'NORMAL' | 'STRONG' | null | undefined } | { ok: false } {
  if (v === undefined) return { ok: true, value: undefined }
  if (v === null || v === '') return { ok: true, value: null }
  const t = String(v).trim().toUpperCase()
  if (t !== 'SOFT' && t !== 'NORMAL' && t !== 'STRONG') return { ok: false }
  return { ok: true, value: t as 'SOFT' | 'NORMAL' | 'STRONG' }
}

export async function getMyBusiness(req: AuthRequest, res: Response) {
  const ctx = getBusinessContextOrRespond(req, res)
  if (!ctx) return
  const { businessId } = ctx
  const business = await getMyBusinessService(businessId)
  if (!business) {
    return res.status(404).json({ error: 'Negocio no encontrado' })
  }
  return res.json(business)
}

export async function getBusinessBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug
    if (!slug) {
      res.status(400).json({ error: 'El slug es obligatorio' })
      return
    }
    const business = await getBusinessBySlugService(slug)
    if (!business) {
      res.status(404).json({ error: 'Negocio no encontrado' })
      return
    }
    res.json(business)
  } catch (err) {
    next(err)
  }
}

export async function getBusinesses(req: Request, res: Response) {
  // TODO: Implement
  res.json({ message: 'Not implemented' })
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { staffEmployeeId } = ctx
    if (!staffEmployeeId) {
      res.status(404).json({ error: 'No tienes un perfil de empleado configurado' })
      return
    }
    const profile = await getMyProfileService(staffEmployeeId)
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }
    res.json(profile)
  } catch (err) {
    next(err)
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { staffEmployeeId } = ctx
    if (!staffEmployeeId) {
      res.status(404).json({ error: 'No tienes un perfil de empleado configurado' })
      return
    }
    const { name, photoUrl } = req.body
    const updated = await updateMyProfileService(staffEmployeeId, { name, photoUrl })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function getBusinessImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const images = await getBusinessImagesService(businessId)
    if (!images) {
      res.status(404).json({ error: 'Negocio no encontrado' })
      return
    }
    res.json(images)
  } catch (err) {
    next(err)
  }
}

export async function updateBusinessImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const { logo, coverPhoto, coverVideo, coverPhotoMobile, coverVideoMobile } = req.body
    const updated = await updateBusinessImagesService(businessId, {
      logo,
      coverPhoto,
      coverVideo,
      coverPhotoMobile,
      coverVideoMobile,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function getBusinessSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const settings = await getBusinessSettingsService(businessId)
    res.json(settings)
  } catch (err) {
    next(err)
  }
}

export async function updateBusinessSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const caps = await getBusinessCapabilities(businessId)
    const {
      fontFamily,
      theme,
      showServiceConfirmModal,
      allowMultipleServices,
      paymentRequired,
      paymentOptionalEnabled,
      paymentType,
      depositPercentage,
      mercadoPagoPublicKey,
      mercadoPagoAccessToken,
      mercadoPagoWebhookSecret,
      publicPageBackgroundDark,
      publicPageBackgroundLight,
      publicBrandColor,
      publicBrandIntensity,
      publicUseGradient,
    } = req.body ?? {}

    if (!caps.allowBrandingAdvanced) {
      const attemptedBranding =
        publicPageBackgroundDark !== undefined ||
        publicPageBackgroundLight !== undefined ||
        publicBrandColor !== undefined ||
        publicBrandIntensity !== undefined ||
        publicUseGradient !== undefined
      if (attemptedBranding) {
        res.status(403).json({ error: 'Este rubro no permite personalizar colores/branding avanzado.' })
        return
      }
    }

    if (theme !== undefined && theme !== null && theme !== '') {
      const t = String(theme).toUpperCase()
      if (t !== 'LIGHT' && t !== 'DARK') {
        res.status(400).json({ error: 'El tema debe ser LIGHT o DARK.' })
        return
      }
    }

    const bgDark = parseOptionalPublicPageBackgroundHex(publicPageBackgroundDark)
    const bgLight = parseOptionalPublicPageBackgroundHex(publicPageBackgroundLight)
    if (!bgDark.ok || !bgLight.ok) {
      res.status(400).json({
        error: 'Los fondos deben ser colores en formato hexadecimal de 6 dígitos (ej. #171717 o #FFFFFF).',
      })
      return
    }

    const brandColor = parseOptionalPublicPageBackgroundHex(publicBrandColor)
    const brandIntensity = parseOptionalBrandIntensity(publicBrandIntensity)
    if (!brandColor.ok || !brandIntensity.ok) {
      res.status(400).json({
        error:
          'El color de marca debe ser hexadecimal de 6 dígitos (ej. #FF00AA) y la intensidad debe ser SOFT, NORMAL o STRONG.',
      })
      return
    }

    const updated = await updateBusinessSettingsService(businessId, {
      ...(fontFamily !== undefined && { fontFamily }),
      ...(theme !== undefined &&
        theme !== null &&
        theme !== '' && {
          theme: String(theme).toUpperCase() === 'LIGHT' ? 'LIGHT' : 'DARK',
        }),
      ...(paymentRequired !== undefined && { paymentRequired: !!paymentRequired }),
      ...(paymentOptionalEnabled !== undefined && {
        paymentOptionalEnabled: !!paymentOptionalEnabled,
      }),
      ...(paymentType !== undefined && { paymentType }),
      ...(depositPercentage !== undefined && {
        depositPercentage:
          depositPercentage === null || depositPercentage === ''
            ? null
            : Number(depositPercentage),
      }),
      ...(mercadoPagoPublicKey !== undefined && { mercadoPagoPublicKey }),
      ...(mercadoPagoAccessToken !== undefined && { mercadoPagoAccessToken }),
      ...(mercadoPagoWebhookSecret !== undefined && { mercadoPagoWebhookSecret }),
      ...(showServiceConfirmModal !== undefined && { showServiceConfirmModal: !!showServiceConfirmModal }),
      ...(allowMultipleServices !== undefined && { allowMultipleServices: !!allowMultipleServices }),
      ...(bgDark.value !== undefined && { publicPageBackgroundDark: bgDark.value }),
      ...(bgLight.value !== undefined && { publicPageBackgroundLight: bgLight.value }),
      ...(brandColor.value !== undefined && { publicBrandColor: brandColor.value }),
      ...(brandIntensity.value !== undefined && { publicBrandIntensity: brandIntensity.value }),
      ...(publicUseGradient !== undefined && { publicUseGradient: !!publicUseGradient }),
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
