import type { ReactNode } from 'react'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { LandingHeader } from './LandingHeader'
import { LandingFooter } from './LandingFooter'

// Brand fonts are scoped to the landing; the panel and booking pages keep their own.
const barlowCondensed = Barlow_Condensed({
  weight: ['700', '800', '900'],
  style: ['italic'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div
      id="inicio"
      className={`${barlowCondensed.variable} ${dmSans.variable} landing min-h-screen scroll-mt-0 bg-[var(--landing-bg)] text-[var(--landing-ink)]`}
    >
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
