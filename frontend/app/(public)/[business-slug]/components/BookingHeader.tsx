'use client'

import { useState, useEffect, useRef } from 'react'
import { useTypewriter } from '../hooks/useTypewriter'

type BookingHeaderProps = {
  businessName: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

const headerButtonClass = (isDark: boolean) =>
  isDark
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  )
}

export function BookingHeader({
  businessName,
  isDarkTheme = true,
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
}: BookingHeaderProps) {
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const authMenuRef = useRef<HTMLDivElement>(null)
  const displayName = useTypewriter(businessName)
  const borderColor = isDarkTheme ? 'border-neutral-600' : 'border-neutral-300'
  const btnClass = `rounded-xl transition-all duration-300 ease-out h-10 sm:h-11 px-3 sm:px-4 text-sm font-medium shrink-0 ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`

  useEffect(() => {
    if (!authMenuOpen) return
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && authMenuRef.current?.contains(e.target as Node)) return
      setAuthMenuOpen(false)
    }
    window.addEventListener('click', handle)
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('click', handle)
      window.removeEventListener('keydown', handle)
    }
  }, [authMenuOpen])

  const handleOpenLogin = () => {
    onOpenLogin?.()
    setAuthMenuOpen(false)
  }
  const handleOpenRegister = () => {
    onOpenRegister?.()
    setAuthMenuOpen(false)
  }

  const dropdownBg = isDarkTheme ? 'bg-neutral-700/95' : 'bg-neutral-100'
  const dropdownItemClass = isDarkTheme
    ? 'text-white hover:bg-neutral-600'
    : 'text-neutral-800 hover:bg-neutral-200'

  return (
    <header className={`w-full border-b ${borderColor} py-4 md:py-6`}>
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 md:px-6 lg:max-w-6xl lg:px-8">
        <button
          type="button"
          onClick={onGoToServices}
          className="min-w-0 truncate text-left text-2xl font-bold md:text-3xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500 rounded"
          aria-label={`Volver a servicios de ${businessName}`}
        >
          <span className={isDarkTheme ? 'text-white' : 'text-neutral-900'}>
            {displayName}
            <span className="animate-pulse">|</span>
          </span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile: single person icon that opens dropdown */}
          {(onOpenLogin ?? onOpenRegister) && (
            <div className="relative md:hidden" ref={authMenuRef}>
              <button
                type="button"
                onClick={() => setAuthMenuOpen((o) => !o)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out sm:h-11 sm:w-11 ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`}
                aria-label="Cuenta"
                aria-expanded={authMenuOpen}
              >
                <PersonIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {authMenuOpen && (
                <div
                  className={`absolute right-0 top-full z-20 mt-2 min-w-[10rem] rounded-xl py-1 shadow-lg ${dropdownBg}`}
                  role="menu"
                >
                  {onOpenLogin && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleOpenLogin}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                    >
                      Iniciar sesión
                    </button>
                  )}
                  {onOpenRegister && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleOpenRegister}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                    >
                      Registrarse
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Desktop: two text buttons */}
          {onOpenLogin && (
            <button type="button" onClick={onOpenLogin} className={`${btnClass} hidden md:block`}>
              Iniciar sesión
            </button>
          )}
          {onOpenRegister && (
            <button type="button" onClick={onOpenRegister} className={`${btnClass} hidden md:block`}>
              Registrarse
            </button>
          )}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out sm:h-11 sm:w-11 ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`}
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
