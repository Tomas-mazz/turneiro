const SRC = {
  default: '/brand/logo-turneiro.svg',
  negativo: '/brand/logo-turneiro-negativo.svg',
} as const

/** Turneiro wordmark (outlined SVG from the brand kit). Aspect ratio 616:213. */
export function TurneiroLogo({
  className = '',
  priority = false,
  variant = 'default',
}: {
  className?: string
  priority?: boolean
  /** `negativo` = white letters for blue or dark backgrounds. */
  variant?: keyof typeof SRC
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimization needed
    <img
      src={SRC[variant]}
      alt="Turneiro"
      width={616}
      height={213}
      className={`block h-auto ${className}`}
      fetchPriority={priority ? 'high' : undefined}
      draggable={false}
    />
  )
}
