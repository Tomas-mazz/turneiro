import type { Metadata } from 'next'
import { LandingShell } from '@/components/landing/LandingShell'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingProduct } from '@/components/landing/LandingProduct'
import { LandingDemo } from '@/components/landing/LandingDemo'
import { LandingIndustries } from '@/components/landing/LandingIndustries'
import { LandingBenefits } from '@/components/landing/LandingBenefits'
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingFaq } from '@/components/landing/LandingFaq'
import { LandingFinalCta } from '@/components/landing/LandingFinalCta'

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
      <LandingProduct />
      <LandingDemo />
      <LandingIndustries />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingFaq />
      <LandingFinalCta />
    </LandingShell>
  )
}
