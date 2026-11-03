import { ACCESS_MAILTO, DEMO_URL } from './constants'

export function LandingFinalCta() {
  return (
    <section className="landing-section !pt-8 !pb-20 sm:!pb-28">
      <div className="landing-section-inner landing-on-blue overflow-hidden rounded-[14px] border-[2.5px] border-[var(--landing-ink)] bg-[var(--landing-accent)] px-7 py-12 text-center shadow-[6px_6px_0_var(--landing-ink)] sm:px-12 sm:py-16">
        <span className="landing-badge">
          1 mes gratis
        </span>
        <h2 className="mt-4 font-heading text-3xl text-white sm:text-4xl">
          Empezá a tomar turnos online
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
          Configuramos tu negocio y en poco tiempo tus clientes ya pueden reservar.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={ACCESS_MAILTO}
            className="landing-btn-highlight"
          >
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
      </div>
    </section>
  )
}
