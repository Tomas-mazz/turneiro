'use client'

import { useTypewriter } from '../hooks/useTypewriter'

type BookingHeaderProps = {
  businessName: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

const themeButtonClass = (isDark: boolean) =>
  isDark
    ? 'border-white bg-neutral-900 text-neutral-100 hover:opacity-90'
    : 'border-black bg-white text-neutral-600 hover:opacity-90'

export function BookingHeader({
  businessName,
  isDarkTheme = true,
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
}: BookingHeaderProps) {
  const displayName = useTypewriter(businessName)
  const borderColor = isDarkTheme ? 'border-neutral-600' : 'border-neutral-300'
  const btnClass = `rounded-xl border transition-all duration-300 ease-out h-10 sm:h-11 px-3 sm:px-4 text-sm font-medium shrink-0 ${themeButtonClass(isDarkTheme)}`

  return (
    <header className={`w-full border-b ${borderColor} py-4 md:py-6`}>
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 md:px-6 lg:max-w-6xl lg:px-8">
        <button
          type="button"
          onClick={onGoToServices}
          className="min-w-0 truncate text-left text-2xl font-bold md:text-3xl outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-neutral-500 rounded"
          aria-label={`Volver a servicios de ${businessName}`}
        >
          <span className={isDarkTheme ? 'text-white' : 'text-neutral-900'}>
            {displayName}
            <span className="animate-pulse">|</span>
          </span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenLogin && (
            <button
              type="button"
              onClick={onOpenLogin}
              className={`${btnClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-neutral-500`}
            >
              Iniciar sesión
            </button>
          )}
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className={`${btnClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-neutral-500`}
            >
              Registrarse
            </button>
          )}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ease-out sm:h-11 sm:w-11 md:h-12 md:w-12 ${themeButtonClass(isDarkTheme)}`}
              aria-label={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkTheme ? 'Modo oscuro' : 'Modo claro'}
            >
              {isDarkTheme ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  <path d="M17.5 4.5v2M17.5 9.5v2M15 7h2M20 7h2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
