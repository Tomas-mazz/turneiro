'use client'

import { BookingHeader } from './BookingHeader'
import { LegalFooter } from './LegalFooter'
import type { AuthUser } from '@/lib/auth'

type BookingLayoutProps = {
  businessName: string
  logo?: string | null
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
  children: React.ReactNode
}

export function BookingLayout({
  businessName,
  logo,
  isDarkTheme = true,
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
  children,
}: BookingLayoutProps) {
  const bgColor = isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(255, 255, 255)'
  const textColor = isDarkTheme ? 'text-white' : 'text-neutral-900'

  return (
    <section
      className={`relative min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-300 ease-out ${textColor}`}
      style={{ backgroundColor: bgColor }}
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
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10 lg:max-w-6xl lg:px-8">
        {children}
      </div>
      <LegalFooter isDarkTheme={isDarkTheme} />
    </section>
  )
}
