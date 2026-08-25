import Link from 'next/link'
import { ACCESS_MAILTO } from './constants'

export function LandingHeader() {
  return (
    <header className="landing-header sticky top-0 z-40 border-b border-[var(--landing-border)]/80 bg-[var(--landing-bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-heading text-[1.35rem] font-semibold tracking-tight text-[var(--landing-ink)]"
        >
          Turneiro
        </Link>
        <nav className="flex items-center gap-5 sm:gap-6">
          <a
            href="#demo"
            className="hidden text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)] sm:inline"
          >
            Demo
          </a>
          <a href={ACCESS_MAILTO} className="landing-btn-primary text-sm">
            Solicitar acceso
          </a>
        </nav>
      </div>
    </header>
  )
}
