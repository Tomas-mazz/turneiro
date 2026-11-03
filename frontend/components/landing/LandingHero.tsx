import { ACCESS_MAILTO, DEMO_URL } from './constants'
import { TurneiroLogo } from './TurneiroLogo'

export function LandingHero() {
  return (
    <section className="landing-section relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15, 118, 110, 0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(15, 118, 110, 0.08), transparent 50%)',
        }}
      />

      <div className="landing-section-inner">
        <span className="landing-badge">1 mes gratis</span>
        <TurneiroLogo className="mt-6 w-[260px] sm:w-[340px] md:w-[400px]" priority />
        <h1 className="mt-6 max-w-2xl text-4xl text-[var(--landing-ink)] sm:text-5xl md:text-6xl">
          Reservas online para tu negocio
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
          Tus clientes eligen día y hora. Vos controlás la agenda con Google Calendar.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <a href={ACCESS_MAILTO} className="landing-btn-primary">
            Solicitar acceso
          </a>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn-secondary"
          >
            Ver demo
          </a>
        </div>
        <p className="mt-4 text-sm text-[var(--landing-muted)]">
          Barberías y salones
        </p>
      </div>
    </section>
  )
}
