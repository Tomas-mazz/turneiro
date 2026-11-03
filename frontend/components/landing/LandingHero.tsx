import { ACCESS_MAILTO, DEMO_URL } from './constants'
import { TurneiroLogo } from './TurneiroLogo'

export function LandingHero() {
  return (
    <section className="landing-section landing-hero landing-on-blue relative overflow-hidden">
      <div className="landing-section-inner">
        <span className="landing-badge">1 mes gratis</span>
        <TurneiroLogo variant="negativo" className="mt-6 w-[260px] sm:w-[340px] md:w-[400px]" priority />
        <h1 className="mt-6 max-w-2xl text-4xl text-white sm:text-5xl md:text-6xl">
          Reservas online para tu negocio
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          Tus clientes eligen día y hora. Vos controlás la agenda con Google Calendar.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <a href={ACCESS_MAILTO} className="landing-btn-highlight">
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
        <p className="mt-5 text-sm text-white/80">
          Barberías y salones
        </p>
      </div>
    </section>
  )
}
