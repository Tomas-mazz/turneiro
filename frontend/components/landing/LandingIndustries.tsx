import Image from 'next/image'

const industries = [
  {
    name: 'Barberías',
    available: true,
    image: '/landing/barberia.jpg',
    alt: 'Interior de una barbería moderna',
  },
  {
    name: 'Salones',
    available: true,
    image: '/landing/salon.jpg',
    alt: 'Interior de un salón de belleza',
  },
  {
    name: 'Consultorios / salud',
    available: false,
    image: '/landing/consultorio.jpg',
    alt: 'Consultorio profesional',
  },
  {
    name: 'Otros profesionales',
    available: false,
    image: '/landing/profesionales.jpg',
    alt: 'Espacio de trabajo profesional',
  },
]

export function LandingIndustries() {
  return (
    <section id="rubros" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium tracking-wide text-[var(--landing-accent)]">
          Rubros
        </p>
        <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-3xl">
          Hecho para negocios de belleza
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--landing-muted)]">
          Hoy está pensado para barberías y salones. Pronto sumamos más rubros.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {industries.map((item) => (
            <li
              key={item.name}
              className={`group relative overflow-hidden rounded-2xl ${
                item.available
                  ? 'ring-1 ring-[var(--landing-border)]'
                  : 'ring-1 ring-dashed ring-[var(--landing-border)]'
              }`}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
                  className={`object-cover transition-transform duration-500 ${
                    item.available
                      ? 'group-hover:scale-[1.03]'
                      : 'grayscale-[40%] opacity-70'
                  }`}
                />
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-t ${
                    item.available
                      ? 'from-black/70 via-black/20 to-transparent'
                      : 'from-black/75 via-black/35 to-black/10'
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <p
                    className={`font-heading text-sm font-semibold text-white sm:text-base ${
                      !item.available ? 'line-through decoration-white/40' : ''
                    }`}
                  >
                    {item.name}
                  </p>
                  {!item.available && (
                    <p className="mt-1 text-[0.7rem] uppercase tracking-wider text-white/75">
                      Próximamente
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
