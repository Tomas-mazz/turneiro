import { prisma } from './prisma'

export type IndustryCapabilities = {
  /** Whether a Service can have SubServices (variants/options). */
  allowSubServices: boolean
  /** Whether advanced public-page branding controls are enabled (brand color, intensity, gradient, backgrounds). */
  allowBrandingAdvanced: boolean
}

export class IndustryCapabilityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IndustryCapabilityError'
  }
}

type CacheEntry = { value: IndustryCapabilities; expiresAt: number }
const CAPABILITIES_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30_000

function normalizeCategory(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
}

export function capabilitiesForCategory(category: string | null | undefined): IndustryCapabilities {
  const c = normalizeCategory(category)

  // IMPORTANT: keep this mapping small and explicit. New industries should be added here
  // (Stage A). Later we can move this to DB (Stage B).
  if (c === 'barbershop') {
    return {
      allowSubServices: false,
      allowBrandingAdvanced: false,
    }
  }

  // Default: keep current behavior (manicura stays exactly as-is).
  return {
    allowSubServices: true,
    allowBrandingAdvanced: true,
  }
}

export async function getBusinessCapabilities(businessId: string): Promise<IndustryCapabilities> {
  const now = Date.now()
  const cached = CAPABILITIES_CACHE.get(businessId)
  if (cached && cached.expiresAt > now) return cached.value

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { category: true },
  })
  const value = capabilitiesForCategory(business?.category)
  CAPABILITIES_CACHE.set(businessId, { value, expiresAt: now + CACHE_TTL_MS })
  return value
}

export async function assertBusinessCapability(
  businessId: string,
  capability: keyof IndustryCapabilities,
  message: string
): Promise<void> {
  const caps = await getBusinessCapabilities(businessId)
  if (!caps[capability]) throw new IndustryCapabilityError(message)
}

