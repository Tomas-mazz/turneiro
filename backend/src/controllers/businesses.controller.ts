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
    const {
      showServiceConfirmModal,
      paymentRequired,
      paymentOptionalEnabled,
      paymentType,
      depositPercentage,
      mercadoPagoPublicKey,
      mercadoPagoAccessToken,
      mercadoPagoWebhookSecret,
    } = req.body ?? {}
    const updated = await updateBusinessSettingsService(businessId, {
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
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
