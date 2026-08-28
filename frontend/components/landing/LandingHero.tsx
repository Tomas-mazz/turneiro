import { ACCESS_MAILTO, DEMO_URL } from './constants'

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
        <p className="mt-5 font-heading text-5xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-6xl md:text-7xl">
          Turneiro
        </p>
        <h1 className="mt-5 max-w-2xl font-heading text-2xl font-medium leading-snug tracking-tight text-[var(--landing-ink)] sm:text-3xl md:text-[2.15rem]">
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
