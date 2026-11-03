/** Turneiro wordmark (outlined SVG from the brand kit). Aspect ratio 616:213. */
export function TurneiroLogo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimization needed
    <img
      src="/brand/logo-turneiro.svg"
      alt="Turneiro"
      width={616}
      height={213}
      className={`block h-auto ${className}`}
      fetchPriority={priority ? 'high' : undefined}
      draggable={false}
    />
  )
}
