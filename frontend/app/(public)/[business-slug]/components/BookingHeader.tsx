'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTypewriter } from '../hooks/useTypewriter'
import type { AuthUser } from '@/lib/auth'

type BookingHeaderProps = {
  businessName: string
  logo?: string | null
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onGoToServices: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
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

/** Icon for "not logged in" (guest): square open on the right with arrow pointing right */
function LoginEntryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* Rectangle open on the right: left, top, bottom */}
      <path d="M5 5v14M5 5h11M5 19h11" />
      {/* Arrow shaft + arrowhead */}
      <path d="M9 12h5M16 10l2 2-2 2" />
    </svg>
  )
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'ADMIN',
  OWNER: 'Dueño',
  STAFF: 'Staff',
  USER: 'Cliente',
}

export function BookingHeader({
  businessName,
  logo,
  isDarkTheme = true,
  onToggleTheme,
  onGoToServices,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
}: BookingHeaderProps) {
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const authMenuRef = useRef<HTMLDivElement>(null)
  const displayName = useTypewriter(businessName)
  const borderColor = isDarkTheme ? 'border-neutral-600' : 'border-neutral-300'
  const btnClass = `rounded-xl transition-all duration-300 ease-out h-10 sm:h-11 px-3 sm:px-4 text-sm font-medium shrink-0 ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`

  const isStaffOrOwner = user?.role === 'OWNER' || user?.role === 'STAFF'
  const displayUserName = user?.name?.trim() || user?.email || 'Usuario'
  const roleLabel = user?.role ? ROLE_LABEL[user.role] ?? user.role : ''

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
  const handleLogout = () => {
    onLogout?.()
    setAuthMenuOpen(false)
  }

  const dropdownBg = isDarkTheme ? 'bg-neutral-700/95' : 'bg-neutral-100'
  const dropdownItemClass = isDarkTheme
    ? 'text-white hover:bg-neutral-600'
    : 'text-neutral-800 hover:bg-neutral-200'

  const showGuestAuth = !user && (onOpenLogin ?? onOpenRegister)

  return (
    <header className={`w-full border-b ${borderColor} py-4 md:py-6`}>
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 md:px-6 lg:max-w-6xl lg:px-8">
        <button
          type="button"
          onClick={onGoToServices}
          className="flex min-w-0 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500 rounded"
          aria-label={`Volver a servicios de ${businessName}`}
        >
          {logo && (
            <img
              src={logo}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover md:h-12 md:w-12"
            />
          )}
          <span className={`truncate text-2xl font-bold md:text-3xl ${isDarkTheme ? 'text-white' : 'text-neutral-900'}`}>
            {displayName}
            <span className="animate-pulse">|</span>
          </span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logged-in: user name + role and dropdown */}
          {user && onLogout && (
            <div className="relative" ref={authMenuRef}>
              <button
                type="button"
                onClick={() => setAuthMenuOpen((o) => !o)}
                className={`flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ease-out h-10 w-10 shrink-0 md:h-11 md:w-auto md:min-w-0 md:max-w-[12rem] md:px-3 md:justify-start lg:max-w-[14rem] lg:px-4 text-sm font-medium ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`}
                aria-label="Menú de cuenta"
                aria-expanded={authMenuOpen}
              >
                <PersonIcon className="h-5 w-5 shrink-0 md:h-5 md:w-5" />
                <span className="min-w-0 truncate md:inline hidden">
                  {displayUserName}
                  {roleLabel && (
                    <span className={isDarkTheme ? ' text-neutral-300' : ' text-neutral-600'}>
                      {' '}({roleLabel})
                    </span>
                  )}
                </span>
              </button>
              {authMenuOpen && (
              <div
                  className={`absolute right-0 top-full z-20 mt-2 min-w-[11rem] rounded-xl py-1 shadow-lg overflow-hidden ${dropdownBg}`}
                  role="menu"
                >
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className={`block w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                      onClick={() => setAuthMenuOpen(false)}
                    >
                      Panel admin
                    </Link>
                  )}
                  {isStaffOrOwner && (
                    <>
                      <Link
                        href="/setting"
                        role="menuitem"
                        className={`block w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                        onClick={() => setAuthMenuOpen(false)}
                      >
                        Configuración
                      </Link>
                    </>
                  )}
                  {user.role === 'USER' && (
                    <Link
                      href="/account"
                      role="menuitem"
                      className={`block w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                      onClick={() => setAuthMenuOpen(false)}
                    >
                      Mi cuenta
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium ${dropdownItemClass}`}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Guest: mobile "entrar" icon dropdown */}
          {showGuestAuth && (
            <div className="relative md:hidden" ref={authMenuRef}>
              <button
                type="button"
                onClick={() => setAuthMenuOpen((o) => !o)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out sm:h-11 sm:w-11 ${headerButtonClass(isDarkTheme)} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-500`}
                aria-label="Cuenta"
                aria-expanded={authMenuOpen}
              >
                <LoginEntryIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {authMenuOpen && (
                <div
                  className={`absolute right-0 top-full z-20 mt-2 min-w-[10rem] rounded-xl py-1 shadow-lg overflow-hidden ${dropdownBg}`}
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
          {/* Guest: desktop text buttons */}
          {showGuestAuth && onOpenLogin && (
            <button type="button" onClick={onOpenLogin} className={`${btnClass} hidden md:block`}>
              Iniciar sesión
            </button>
          )}
          {showGuestAuth && onOpenRegister && (
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
