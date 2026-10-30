import type { CSSProperties } from 'react'
import { mixHex } from './colorMix'
import { normalizeHex6 } from './luminance'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
  resolvePublicPageBackground,
} from '@/lib/publicPageBackground'

export type BrandIntensity = 'SOFT' | 'NORMAL' | 'STRONG'

type Input = {
  brandColor: string | null | undefined
  intensity: BrandIntensity | null | undefined
  useGradient: boolean | null | undefined
  variant: 'DARK' | 'LIGHT'
  /** Legacy background color chosen explicitly by owner/admin. */
  legacyBackground: string | null | undefined
}

type Output = {
  /** The solid background color (also used for deriving booking CSS vars). */
  backgroundHex: string
  /** Optional subtle gradient. */
  backgroundImage?: string
}

const INTENSITY: Record<BrandIntensity, { darkBlendToNearBlack: number; lightBlendToWhite: number; gradient: number }> = {
  // Higher = more neutral (less saturated) because we blend more toward near-black/white.
  SOFT: { darkBlendToNearBlack: 0.86, lightBlendToWhite: 0.92, gradient: 0.16 },
  NORMAL: { darkBlendToNearBlack: 0.78, lightBlendToWhite: 0.88, gradient: 0.2 },
  STRONG: { darkBlendToNearBlack: 0.7, lightBlendToWhite: 0.84, gradient: 0.24 },
}

export function bookingDerivedBackground(input: Input): Output {
  const fallbackLegacy = normalizeHex6(
    input.legacyBackground ??
      (input.variant === 'DARK' ? DEFAULT_PUBLIC_PAGE_BG_DARK : DEFAULT_PUBLIC_PAGE_BG_LIGHT),
    input.variant === 'DARK' ? DEFAULT_PUBLIC_PAGE_BG_DARK : DEFAULT_PUBLIC_PAGE_BG_LIGHT
  )

  const rawBrand = input.brandColor ? normalizeHex6(input.brandColor, fallbackLegacy) : null
  if (!rawBrand) return { backgroundHex: fallbackLegacy }

  const intensity = input.intensity ?? 'SOFT'
  const cfg = INTENSITY[intensity]

  const backgroundHex =
    input.variant === 'DARK'
      ? mixHex(rawBrand, '#0B0B0F', cfg.darkBlendToNearBlack)
      : mixHex(rawBrand, '#FFFFFF', cfg.lightBlendToWhite)

  if (!input.useGradient) return { backgroundHex }

  // Subtle “brand wash”: a soft highlight toward the brand, without saturating the whole canvas.
  const hi =
    input.variant === 'DARK'
      ? mixHex(backgroundHex, rawBrand, cfg.gradient)
      : mixHex(backgroundHex, rawBrand, cfg.gradient * 0.85)
  const lo =
    input.variant === 'DARK'
      ? mixHex(backgroundHex, '#000000', 0.08)
      : mixHex(backgroundHex, '#FFFFFF', 0.06)

  return {
    backgroundHex,
    backgroundImage: `radial-gradient(120% 90% at 18% 8%, ${hi} 0%, ${backgroundHex} 55%), linear-gradient(135deg, ${lo}, ${backgroundHex})`,
  }
}

export function bookingBackgroundStyle(input: Input): CSSProperties {
  const out = bookingDerivedBackground(input)
  return {
    backgroundColor: out.backgroundHex,
    ...(out.backgroundImage ? { backgroundImage: out.backgroundImage } : {}),
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  }
}


export type BookingBackgroundSettings = {
  publicPageBackgroundDark?: string | null
  publicPageBackgroundLight?: string | null
  publicBrandColor?: string | null
  publicBrandIntensity?: string | null
  publicUseGradient?: boolean | null
}

/** Page background for a business's booking page; shared by the page and its loading skeleton. */
export function resolveBookingPageBackground(
  isDarkTheme: boolean,
  settings: BookingBackgroundSettings | null | undefined
): Output {
  return bookingDerivedBackground({
    brandColor: settings?.publicBrandColor ?? null,
    intensity: (settings?.publicBrandIntensity as BrandIntensity | null | undefined) ?? null,
    useGradient: settings?.publicUseGradient ?? false,
    variant: isDarkTheme ? 'DARK' : 'LIGHT',
    legacyBackground: resolvePublicPageBackground(
      isDarkTheme,
      settings?.publicPageBackgroundDark ?? null,
      settings?.publicPageBackgroundLight ?? null
    ),
  })
}
