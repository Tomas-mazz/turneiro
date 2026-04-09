'use client'

import { BookingHeader } from './BookingHeader'
import { LegalFooter } from './LegalFooter'
import type { AuthUser } from '@/lib/auth'

type BookingLayoutProps = {
  businessName: string
  logo?: string | null
  isDarkTheme?: boolean
  /** Resolved page background for the current theme (public booking CSS color). */
  pageBackgroundColor?: string
  fontFamily?: string | null
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
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
  fontFamily = 'ROBOTO',
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
  children,
}: BookingLayoutProps) {
  const bgColor =
    pageBackgroundColor ?? (isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(255, 255, 255)')
  const textColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const fontVar = FONT_CSS_VAR_BY_KEY[String(fontFamily || 'ROBOTO').toUpperCase()] ?? FONT_CSS_VAR_BY_KEY.ROBOTO

  return (
    <section
      className={`business-font relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden transition-colors duration-300 ease-out ${textColor}`}
      style={{ backgroundColor: bgColor, ['--font-business' as any]: fontVar }}
    >
      <BookingHeader
        businessName={businessName}
        logo={logo}
        isDarkTheme={isDarkTheme}
        onToggleTheme={onToggleTheme}
        onGoToServices={onGoToServices}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
        user={user}
        onLogout={onLogout}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:px-6 md:py-10 lg:max-w-6xl lg:px-8">
        {children}
      </div>
      <LegalFooter isDarkTheme={isDarkTheme} className="mt-auto" />
    </section>
  )
}
