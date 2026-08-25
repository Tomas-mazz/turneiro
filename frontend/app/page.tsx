import type { Metadata } from 'next'
import { LandingShell } from '@/components/landing/LandingShell'
import { LandingHero } from '@/components/landing/LandingHero'

export const metadata: Metadata = {
  title: 'Turneiro | Reservas online para tu negocio',
  description:
    'Plataforma de turnos online para barberías y salones. Tus clientes reservan; vos controlás la agenda. 1 mes gratis.',
  openGraph: {
    title: 'Turneiro | Reservas online para tu negocio',
    description:
      'Plataforma de turnos online para barberías y salones. 1 mes gratis.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function Home() {
  return (
    <LandingShell>
      <LandingHero />
    </LandingShell>
  )
}
