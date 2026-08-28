import type { ReactNode } from 'react'
import { LandingHeader } from './LandingHeader'
import { LandingFooter } from './LandingFooter'

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div
      id="inicio"
      className="landing min-h-screen scroll-mt-0 bg-[var(--landing-bg)] text-[var(--landing-ink)]"
    >
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
