import Image from 'next/image'
import {
  LandingSection,
  LandingSectionHeader,
} from './LandingSection'

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
    <LandingSection id="rubros" tone="white" className="scroll-mt-20">
      <LandingSectionHeader
        label="Rubros"
        title="Hecho para negocios de belleza"
        description="Hoy está pensado para barberías y salones. Pronto sumamos más rubros."
      />

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {industries.map((item) => (
          <li
            key={item.name}
            className={`group relative overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 ${
              item.available
                ? 'ring-1 ring-[var(--landing-border)] hover:shadow-md'
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
    </LandingSection>
  )
}
