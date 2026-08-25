import { ACCESS_MAILTO, DEMO_URL } from './constants'

export function LandingFinalCta() {
  return (
    <section className="px-5 pb-20 pt-8 sm:px-8 sm:pb-28">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-[var(--landing-ink)] px-7 py-12 text-center sm:px-12 sm:py-16">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Empezá a tomar turnos online
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
          1 mes gratis. Configuramos tu negocio y en poco tiempo tus clientes ya
          pueden reservar.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={ACCESS_MAILTO}
            className="inline-flex items-center justify-center rounded-[0.625rem] bg-[var(--landing-accent)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--landing-accent-hover)]"
          >
            Solicitar acceso
          </a>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-[0.625rem] border border-white/25 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:border-white/50 hover:bg-white/5"
          >
            Ver demo
          </a>
        </div>
      </div>
    </section>
  )
}
