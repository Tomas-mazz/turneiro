'use client'

import Link from 'next/link'

type LegalFooterProps = {
  /** @deprecated Kept for API compatibility; footer colors follow --booking-* from the layout. */
  isDarkTheme?: boolean
  className?: string
}

export function LegalFooter({ className = '' }: LegalFooterProps) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-3 px-4 py-6 text-center text-sm text-[color:var(--booking-footer-muted,#737373)] ${className}`.trim()}
    >
      <Link
        href="https://www.turneiro.com/privacy"
        className="underline underline-offset-4 transition-colors hover:text-[color:var(--booking-fg,#171717)]"
      >
        Política de privacidad
      </Link>
      <span aria-hidden="true">·</span>
      <Link
        href="https://www.turneiro.com/terms"
        className="underline underline-offset-4 transition-colors hover:text-[color:var(--booking-fg,#171717)]"
      >
        Términos del servicio
      </Link>
    </footer>
  )
}
