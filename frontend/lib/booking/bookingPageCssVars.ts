import type { CSSProperties } from 'react'
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
      '--booking-cart-bg': 'rgba(12,12,16,0.94)',
      '--booking-cart-border': 'rgba(255,255,255,0.16)',
      '--booking-cart-shadow': '0 -4px 28px rgba(0,0,0,0.45)',
      '--booking-cart-cta-bg': '#fafafa',
      '--booking-cart-cta-text': '#111111',
      '--booking-cart-cta-hover': 'rgba(250,250,250,0.9)',
      '--booking-cart-close-border': 'rgba(255,255,255,0.28)',
      '--booking-cart-close-text': 'rgba(255,255,255,0.65)',
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
      '--booking-modal-bg': 'rgba(22,22,26,0.98)',
      '--booking-modal-border': 'rgba(255,255,255,0.14)',
      '--booking-footer-muted': 'rgba(255,255,255,0.62)',
    } as CSSProperties
  }

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
    '--booking-cart-bg': 'rgba(255,255,255,0.96)',
    '--booking-cart-border': 'rgba(23,23,23,0.12)',
    '--booking-cart-shadow': '0 -4px 28px rgba(0,0,0,0.12)',
    '--booking-cart-cta-bg': '#171717',
    '--booking-cart-cta-text': '#fafafa',
    '--booking-cart-cta-hover': 'rgba(23,23,23,0.92)',
    '--booking-cart-close-border': 'rgba(23,23,23,0.2)',
    '--booking-cart-close-text': 'rgba(23,23,23,0.55)',
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
    '--booking-modal-bg': '#ffffff',
    '--booking-modal-border': 'rgba(23,23,23,0.12)',
    '--booking-footer-muted': 'rgba(23,23,23,0.55)',
  } as CSSProperties
}

/** Fallback vars when no custom background is applied (e.g. hero). */
export function bookingPageCssVarsFromTheme(isDarkTheme: boolean): CSSProperties {
  return bookingPageCssVars(isDarkTheme ? DEFAULT_PUBLIC_PAGE_BG_DARK : DEFAULT_PUBLIC_PAGE_BG_LIGHT)
}
