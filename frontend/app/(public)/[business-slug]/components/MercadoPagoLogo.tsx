import React from 'react'

export function MercadoPagoLogo({ className }: { className?: string }) {
  // Simple inline SVG so `next build` doesn't depend on external assets.
  // Uses `currentColor` so parent styles like `text-white` work.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 17V7h2.2l2.3 4.6L13.8 7H16v10h-2V11.3l-2.5 4.1h-.9l-2.5-4.1V17H7Z" />
      <path d="M15.6 7H19a3.1 3.1 0 0 1 0 6.2h-1.4V17h-2V7Zm2 2v2.2h1.1a1.1 1.1 0 0 0 0-2.2h-1.1Z" />
    </svg>
  )
}

