'use client'

import Link from 'next/link'

type LegalFooterProps = {
  isDarkTheme?: boolean
  className?: string
}

export function LegalFooter({ isDarkTheme = false, className = '' }: LegalFooterProps) {
  const textColor = isDarkTheme ? 'text-white/70' : 'text-neutral-500'
  const hoverColor = isDarkTheme ? 'hover:text-white' : 'hover:text-neutral-800'

  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-3 px-4 py-6 text-center text-sm ${textColor} ${className}`.trim()}
    >
      <Link
        href="https://www.turneiro.com/privacy"
        className={`underline underline-offset-4 transition-colors ${hoverColor}`}
      >
        Privacy Policy
      </Link>
      <span aria-hidden="true">·</span>
      <Link
        href="https://www.turneiro.com/terms"
        className={`underline underline-offset-4 transition-colors ${hoverColor}`}
      >
        Terms of Service
      </Link>
    </footer>
  )
}
