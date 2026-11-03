import { ACCESS_MAILTO } from './constants'
import { TurneiroLogo } from './TurneiroLogo'

export function LandingHeader() {
  return (
    <header className="landing-header sticky top-0 z-40 border-b border-[var(--landing-border)]/80 bg-[var(--landing-bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:h-16 sm:px-8">
        <a href="#inicio" aria-label="Turneiro, ir al inicio">
          <TurneiroLogo className="w-[120px] sm:w-[136px]" priority />
        </a>
        <nav className="flex items-center gap-4 sm:gap-6">
          <a
            href="#demo"
            className="hidden text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)] sm:inline"
          >
            Demo
          </a>
          <a
            href="#precios"
            className="hidden text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)] sm:inline"
          >
            Precios
          </a>
          <a href={ACCESS_MAILTO} className="landing-btn-primary px-3.5 py-2 text-sm sm:px-5 sm:py-2.5">
            Solicitar acceso
          </a>
        </nav>
      </div>
    </header>
  )
}
