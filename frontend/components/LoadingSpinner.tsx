'use client'

type LoadingSpinnerProps = {
  logo?: string | null
  size?: 'sm' | 'md' | 'lg'
  bgColor?: string
  fullScreen?: boolean
}

export function LoadingSpinner({
  logo,
  size = 'lg',
  bgColor = 'bg-neutral-100',
  fullScreen = true,
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

  const containerClasses = fullScreen
    ? `flex min-h-screen items-center justify-center ${bgColor}`
    : `flex items-center justify-center py-12 ${bgColor}`

  if (logo) {
    return (
      <div className={containerClasses}>
        <img
          src={logo}
          alt="Cargando"
          className={`${sizeClasses[size]} rounded-full object-cover animate-heartbeat`}
        />
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div
        className={`${spinnerSizeClasses[size]} animate-spin rounded-full border-sky-600 border-t-transparent`}
      />
    </div>
  )
}
