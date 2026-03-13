'use client'

/** Same as booking page dark step background (see page.tsx isDarkTheme). */
const BOOKING_DARK_BG = 'hsl(0, 0%, 9%)'

type LoadingSpinnerProps = {
  logo?: string | null
  size?: 'sm' | 'md' | 'lg'
  /** Used when variant is "light" (dashboard, admin, light booking). */
  bgColor?: string
  fullScreen?: boolean
  /**
   * light: claro (neutral-100), spinner azul — dashboards y tema claro reserva.
   * dark: mismo gris que la página en modo oscuro (no negro puro), spinner claro.
   */
  variant?: 'light' | 'dark'
}

export function LoadingSpinner({
  logo,
  size = 'lg',
  bgColor = 'bg-neutral-100',
  fullScreen = true,
  variant = 'light',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  }

  const spinnerSizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4',
  }

  const isDark = variant === 'dark'
  const containerBgClass = isDark ? '' : bgColor
  const containerStyle = isDark ? { backgroundColor: BOOKING_DARK_BG } : undefined

  const containerClasses = fullScreen
    ? `flex min-h-screen items-center justify-center ${containerBgClass}`
    : `flex items-center justify-center py-12 ${containerBgClass}`

  const spinnerRingClass = isDark
    ? 'border-neutral-400 border-t-transparent'
    : 'border-sky-600 border-t-transparent'

  if (logo) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <img
          src={logo}
          alt="Cargando"
          className={`${sizeClasses[size]} rounded-full object-cover animate-heartbeat`}
        />
      </div>
    )
  }

  return (
    <div className={containerClasses} style={containerStyle}>
      <div
        className={`${spinnerSizeClasses[size]} animate-spin rounded-full ${spinnerRingClass}`}
      />
    </div>
  )
}
