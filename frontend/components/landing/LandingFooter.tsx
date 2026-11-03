import Link from 'next/link'
import { CONTACT_EMAIL } from './constants'
import { TurneiroLogo } from './TurneiroLogo'

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <TurneiroLogo className="w-[120px]" />
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--landing-muted)]">
              Reservas online para barberías y salones.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--landing-border)] pt-6 text-sm text-[var(--landing-muted)]">
          <Link
            href="/privacy"
            className="underline-offset-4 transition-colors hover:text-[var(--landing-ink)] hover:underline"
          >
            Política de privacidad
          </Link>
          <span aria-hidden className="text-[var(--landing-border)]">
            ·
          </span>
          <Link
            href="/terms"
            className="underline-offset-4 transition-colors hover:text-[var(--landing-ink)] hover:underline"
          >
            Términos del servicio
          </Link>
        </div>
      </div>
    </footer>
  )
}
