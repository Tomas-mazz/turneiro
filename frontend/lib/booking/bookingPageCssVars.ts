import type { CSSProperties } from 'react'
import { mixHex, mixTowardBlack } from './colorMix'
import { isDarkUiForBackground, normalizeHex6 } from './luminance'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'

/**
 * CSS custom properties for the public booking shell so text, stepper, cart and controls
 * stay readable on owner-defined background colors.
 */
export function bookingPageCssVars(backgroundHex: string): CSSProperties {
  const hex = normalizeHex6(backgroundHex, DEFAULT_PUBLIC_PAGE_BG_DARK)
  const dark = isDarkUiForBackground(hex)

  if (dark) {
    /* Superficies elevadas: mezcla del color del negocio + blanco (no blanco puro; coherencia con el fondo). */
    const modalSurface = mixHex(hex, '#FFFFFF', 0.76)
    const cartSurface = mixHex(hex, '#FFFFFF', 0.7)
    const modalBorder = mixTowardBlack(modalSurface, 0.1)
    const cartBorder = mixTowardBlack(cartSurface, 0.11)
    const ctaFill = mixHex(hex, '#111111', 0.72)

    return {
      '--booking-page-bg': hex,
      '--booking-fg': 'rgba(255,255,255,0.96)',
      '--booking-fg-muted': 'rgba(255,255,255,0.72)',
      '--booking-fg-subtle': 'rgba(255,255,255,0.52)',
      '--booking-fg-heading': 'rgba(255,255,255,0.78)',
      '--booking-border': 'rgba(255,255,255,0.22)',
      '--booking-border-soft': 'rgba(255,255,255,0.12)',
      '--booking-divide': 'rgba(255,255,255,0.18)',
      '--booking-row-hover': 'rgba(255,255,255,0.08)',
      '--booking-control-bg': 'rgba(255,255,255,0.14)',
      '--booking-control-hover': 'rgba(255,255,255,0.22)',
      '--booking-control-text': 'rgba(255,255,255,0.96)',
      '--booking-dropdown-bg': 'rgba(28,28,32,0.96)',
      '--booking-dropdown-hover': 'rgba(255,255,255,0.1)',
      '--booking-stepper-track': 'rgba(255,255,255,0.22)',
      '--booking-stepper-fill': 'rgba(255,255,255,0.88)',
      '--booking-stepper-muted': 'rgba(255,255,255,0.48)',
      '--booking-stepper-active': 'rgba(255,255,255,0.96)',
      '--booking-stepper-done': 'rgba(255,255,255,0.62)',
      '--booking-stepper-ring-offset': hex,
      '--booking-stepper-dot-border-strong': 'rgba(255,255,255,0.55)',
      '--booking-stepper-dot-fill': hex,
      '--booking-bullet-border': 'rgba(255,255,255,0.45)',
      '--booking-bullet-fill': '#ffffff',
      '--booking-vermas-border': 'rgba(255,255,255,0.22)',
      '--booking-vermas-bg': 'rgba(0,0,0,0.18)',
      '--booking-vermas-text': 'rgba(255,255,255,0.82)',
      '--booking-avatar-bg': 'rgba(255,255,255,0.16)',
      '--booking-avatar-text': 'rgba(255,255,255,0.92)',
      '--booking-link-hover': 'rgba(255,255,255,1)',
      '--booking-input-bg': 'rgba(0,0,0,0.22)',
      '--booking-input-border': 'rgba(255,255,255,0.28)',
      '--booking-input-text': 'rgba(255,255,255,0.96)',
      '--booking-input-placeholder': 'rgba(255,255,255,0.45)',
      '--booking-card-bg': 'rgba(0,0,0,0.2)',
      '--booking-card-border': 'rgba(255,255,255,0.18)',
      '--booking-secondary-btn-border': 'rgba(255,255,255,0.35)',
      '--booking-secondary-btn-bg': 'rgba(255,255,255,0.1)',
      /* Modales / carrito: tinte del color de página + blanco */
      '--booking-modal-bg': modalSurface,
      '--booking-modal-fg': '#171717',
      '--booking-modal-fg-muted': 'rgba(23,23,23,0.68)',
      '--booking-modal-fg-subtle': 'rgba(23,23,23,0.5)',
      '--booking-modal-border': modalBorder,
      '--booking-modal-hover': 'rgba(0,0,0,0.07)',
      '--booking-modal-control-bg': mixTowardBlack(modalSurface, 0.05),
      '--booking-modal-control-hover': mixTowardBlack(modalSurface, 0.09),
      '--booking-modal-avatar-bg': mixTowardBlack(modalSurface, 0.08),
      '--booking-modal-avatar-text': '#171717',
      '--booking-modal-disabled-bg': mixTowardBlack(modalSurface, 0.03),
      '--booking-cart-bg': cartSurface,
      '--booking-cart-fg': '#171717',
      '--booking-cart-fg-muted': 'rgba(23,23,23,0.72)',
      '--booking-cart-border': cartBorder,
      '--booking-cart-shadow': '0 -6px 36px rgba(0,0,0,0.22)',
      '--booking-cart-cta-bg': ctaFill,
      '--booking-cart-cta-text': '#fafafa',
      '--booking-cart-cta-hover': mixHex(ctaFill, '#000000', 0.12),
      '--booking-cart-close-border': mixTowardBlack(cartSurface, 0.14),
      '--booking-cart-close-text': 'rgba(23,23,23,0.55)',
      '--booking-cart-close-hover': mixTowardBlack(cartSurface, 0.06),
      /* Cristal esmerilado (blur): tinte suave hacia el color de página + fallback opaco */
      // iOS-like glass: less opaque fill, more blur-driven translucency.
      '--booking-glass-fill': `color-mix(in srgb, ${hex} 30%, rgba(255, 255, 255, 0.12))`,
      '--booking-glass-border': 'rgba(255, 255, 255, 0.52)',
      '--booking-glass-shadow':
        '0 12px 48px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
      '--booking-glass-fallback': modalSurface,
      '--booking-footer-muted': 'rgba(255,255,255,0.62)',
    } as CSSProperties
  }

  const modalSurfaceLight = mixHex(hex, '#FFFFFF', 0.42)
  const cartSurfaceLight = mixHex(hex, '#FFFFFF', 0.48)
  const modalBorderLight = mixTowardBlack(modalSurfaceLight, 0.08)
  const cartBorderLight = mixTowardBlack(cartSurfaceLight, 0.09)
  const ctaFillLight = mixHex(hex, '#171717', 0.55)

  return {
    '--booking-page-bg': hex,
    '--booking-fg': 'rgba(23,23,23,0.96)',
    '--booking-fg-muted': 'rgba(23,23,23,0.72)',
    '--booking-fg-subtle': 'rgba(23,23,23,0.55)',
    '--booking-fg-heading': 'rgba(23,23,23,0.78)',
    '--booking-border': 'rgba(23,23,23,0.18)',
    '--booking-border-soft': 'rgba(23,23,23,0.1)',
    '--booking-divide': 'rgba(23,23,23,0.14)',
    '--booking-row-hover': 'rgba(0,0,0,0.05)',
    '--booking-control-bg': 'rgba(0,0,0,0.06)',
    '--booking-control-hover': 'rgba(0,0,0,0.1)',
    '--booking-control-text': 'rgba(23,23,23,0.92)',
    '--booking-dropdown-bg': 'rgba(255,255,255,0.98)',
    '--booking-dropdown-hover': 'rgba(0,0,0,0.06)',
    '--booking-stepper-track': 'rgba(23,23,23,0.18)',
    '--booking-stepper-fill': 'rgba(23,23,23,0.82)',
    '--booking-stepper-muted': 'rgba(23,23,23,0.45)',
    '--booking-stepper-active': 'rgba(23,23,23,0.94)',
    '--booking-stepper-done': 'rgba(23,23,23,0.62)',
    '--booking-stepper-ring-offset': hex,
    '--booking-stepper-dot-border-strong': 'rgba(23,23,23,0.55)',
    '--booking-stepper-dot-fill': hex,
    '--booking-bullet-border': 'rgba(23,23,23,0.45)',
    '--booking-bullet-fill': '#171717',
    '--booking-cart-bg': cartSurfaceLight,
    '--booking-cart-fg': '#171717',
    '--booking-cart-fg-muted': 'rgba(23,23,23,0.72)',
    '--booking-cart-border': cartBorderLight,
    '--booking-cart-shadow': '0 -4px 28px rgba(0,0,0,0.14)',
    '--booking-cart-cta-bg': ctaFillLight,
    '--booking-cart-cta-text': '#fafafa',
    '--booking-cart-cta-hover': mixHex(ctaFillLight, '#000000', 0.1),
    '--booking-cart-close-border': mixTowardBlack(cartSurfaceLight, 0.12),
    '--booking-cart-close-text': 'rgba(23,23,23,0.55)',
    '--booking-cart-close-hover': mixTowardBlack(cartSurfaceLight, 0.05),
    '--booking-vermas-border': 'rgba(23,23,23,0.18)',
    '--booking-vermas-bg': 'rgba(255,255,255,0.85)',
    '--booking-vermas-text': 'rgba(23,23,23,0.78)',
    '--booking-avatar-bg': 'rgba(0,0,0,0.08)',
    '--booking-avatar-text': 'rgba(23,23,23,0.85)',
    '--booking-link-hover': 'rgba(23,23,23,1)',
    '--booking-input-bg': '#ffffff',
    '--booking-input-border': 'rgba(23,23,23,0.22)',
    '--booking-input-text': 'rgba(23,23,23,0.92)',
    '--booking-input-placeholder': 'rgba(23,23,23,0.42)',
    '--booking-card-bg': '#ffffff',
    '--booking-card-border': 'rgba(23,23,23,0.12)',
    '--booking-secondary-btn-border': 'rgba(23,23,23,0.28)',
    '--booking-secondary-btn-bg': 'transparent',
    '--booking-modal-bg': modalSurfaceLight,
    '--booking-modal-fg': '#171717',
    '--booking-modal-fg-muted': 'rgba(23,23,23,0.65)',
    '--booking-modal-fg-subtle': 'rgba(23,23,23,0.5)',
    '--booking-modal-border': modalBorderLight,
    '--booking-modal-hover': 'rgba(0,0,0,0.06)',
    '--booking-modal-control-bg': mixTowardBlack(modalSurfaceLight, 0.04),
    '--booking-modal-control-hover': mixTowardBlack(modalSurfaceLight, 0.08),
    '--booking-modal-avatar-bg': mixTowardBlack(modalSurfaceLight, 0.07),
    '--booking-modal-avatar-text': '#171717',
    '--booking-modal-disabled-bg': mixTowardBlack(modalSurfaceLight, 0.03),
    // Light UI: keep glass bright but still translucent.
    '--booking-glass-fill': `color-mix(in srgb, ${hex} 18%, rgba(255, 255, 255, 0.16))`,
    '--booking-glass-border': 'rgba(255, 255, 255, 0.72)',
    '--booking-glass-shadow':
      '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
    '--booking-glass-fallback': modalSurfaceLight,
    '--booking-footer-muted': 'rgba(23,23,23,0.55)',
  } as CSSProperties
}

/** Fallback vars when no custom background is applied (e.g. hero). */
export function bookingPageCssVarsFromTheme(isDarkTheme: boolean): CSSProperties {
  return bookingPageCssVars(isDarkTheme ? DEFAULT_PUBLIC_PAGE_BG_DARK : DEFAULT_PUBLIC_PAGE_BG_LIGHT)
}
