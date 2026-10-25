'use client'

import { useMemo } from 'react'
import { BookingHeader } from './BookingHeader'
import { LegalFooter } from './LegalFooter'
import type { AuthUser } from '@/lib/auth'
import { bookingPageCssVars } from '@/lib/booking'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'

type BookingLayoutProps = {
  businessName: string
  logo?: string | null
  isDarkTheme?: boolean
  /** Resolved page background for the current theme (public booking CSS color). */
  pageBackgroundColor?: string
  /** Optional subtle gradient for the booking background. */
  pageBackgroundImage?: string
  fontFamily?: string | null
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
  showBusinessName?: boolean
  /** Full-width content above the page column (e.g. the cover); the header floats over it. */
  topSlot?: React.ReactNode
  children: React.ReactNode
}

const FONT_CSS_VAR_BY_KEY: Record<string, string> = {
  ROBOTO: 'var(--font-roboto)',
  MONTSERRAT: 'var(--font-montserrat)',
  INTER: 'var(--font-inter)',
  POPPINS: 'var(--font-poppins)',
  NUNITO: 'var(--font-nunito)',
  PLAYFAIR: 'var(--font-playfair)',
}

export function BookingLayout({
  businessName,
  logo,
  isDarkTheme = true,
  pageBackgroundColor,
  pageBackgroundImage,
  fontFamily = 'ROBOTO',
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
  showBusinessName = true,
  topSlot,
  children,
}: BookingLayoutProps) {
  const bgColor =
    pageBackgroundColor ?? (isDarkTheme ? DEFAULT_PUBLIC_PAGE_BG_DARK : DEFAULT_PUBLIC_PAGE_BG_LIGHT)
  const fontVar = FONT_CSS_VAR_BY_KEY[String(fontFamily || 'ROBOTO').toUpperCase()] ?? FONT_CSS_VAR_BY_KEY.ROBOTO

  const surfaceStyle = useMemo(
    () => ({
      backgroundColor: bgColor,
      ...(pageBackgroundImage ? { backgroundImage: pageBackgroundImage } : {}),
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      ...bookingPageCssVars(bgColor),
      ['--font-business' as string]: fontVar,
    }),
    [bgColor, fontVar, pageBackgroundImage]
  )

  const headerProps = {
    businessName,
    logo,
    isDarkTheme,
    onToggleTheme,
    onGoToServices,
    onOpenLogin,
    onOpenRegister,
    user,
    onLogout,
    showBusinessName,
  }

  return (
    <section
      className="business-font relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden text-[color:var(--booking-fg)] transition-colors duration-300 ease-out"
      style={surfaceStyle}
    >
      {topSlot ? (
        <div className="relative">
          {topSlot}
          <div className="absolute inset-x-0 top-0 z-20">
            <BookingHeader {...headerProps} overlay />
          </div>
        </div>
      ) : (
        <BookingHeader {...headerProps} />
      )}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:px-6 md:py-10 lg:max-w-6xl lg:px-8">
        {children}
      </div>
      <LegalFooter isDarkTheme={isDarkTheme} className="mt-auto" />
    </section>
  )
}
