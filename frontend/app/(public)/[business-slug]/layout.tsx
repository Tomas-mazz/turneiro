import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type PublicBusinessMeta = {
  name: string
  description: string | null
  logo?: string | null
  coverPhoto: string | null
  address: string | null
}

type BusinessLookup =
  | { status: 'found'; business: PublicBusinessMeta }
  | { status: 'not-found' }
  | { status: 'unavailable' }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Deduplicated per request: generateMetadata and the layout share one fetch. */
const getBusiness = cache(async (slug: string): Promise<BusinessLookup> => {
  try {
    const res = await fetch(`${API_URL}/api/businesses/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) return { status: 'not-found' }
    if (!res.ok) return { status: 'unavailable' }
    return { status: 'found', business: (await res.json()) as PublicBusinessMeta }
  } catch {
    // API caída: dejamos que la página cliente muestre su propio error en vez de un 404 falso.
    return { status: 'unavailable' }
  }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'business-slug': string }>
}): Promise<Metadata> {
  const { 'business-slug': slug } = await params
  const lookup = await getBusiness(slug)
  if (lookup.status !== 'found') return { title: 'Turneiro' }

  const { name, description, logo, coverPhoto, address } = lookup.business
  const title = `${name} | Reservá tu turno`
  const summary =
    description?.trim() ||
    `Reservá tu turno online en ${name}${address ? `, ${address}` : ''}.`
  const image = coverPhoto || logo

  return {
    title,
    description: summary,
    openGraph: {
      title,
      description: summary,
      siteName: name,
      type: 'website',
      locale: 'es_AR',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description: summary,
      ...(image ? { images: [image] } : {}),
    },
    ...(logo ? { icons: { icon: logo } } : {}),
  }
}

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'business-slug': string }>
}) {
  const { 'business-slug': slug } = await params
  const lookup = await getBusiness(slug)
  if (lookup.status === 'not-found') notFound()

  return <>{children}</>
}
