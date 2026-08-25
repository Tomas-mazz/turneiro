const features = [
  {
    title: 'Página de reservas',
    description:
      'Tus clientes eligen servicio, día y hora desde el celular, sin instalar nada.',
  },
  {
    title: 'Google Calendar',
    description:
      'Los turnos se sincronizan con tu agenda. Menos dobles reservas, más control.',
  },
  {
    title: 'Pagos online',
    description:
      'Cobrá seña o el total con Mercado Pago, según cómo quieras trabajar.',
  },
  {
    title: 'Tu marca',
    description:
      'Página propia con el look de tu negocio: colores, fotos y link para compartir.',
  },
]

export function LandingProduct() {
  return (
    <section id="producto" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          El producto
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Todo lo que necesitás para tomar turnos online
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--landing-muted)]">
          Turneiro te da una página de reservas lista para compartir, un panel para
          gestionar servicios y horarios, y sincronización con Google Calendar.
        </p>

        <ul className="mt-12 grid gap-10 sm:grid-cols-2">
          {features.map((item) => (
            <li key={item.title} className="border-t border-[var(--landing-border)] pt-5">
              <h3 className="font-heading text-base font-semibold text-[var(--landing-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-[0.95rem]">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
