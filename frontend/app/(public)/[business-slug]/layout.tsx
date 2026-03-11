import { Metadata } from 'next'

async function getBusinessName(slug: string): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.name
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'business-slug': string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const businessName = await getBusinessName(resolvedParams['business-slug'])

  return {
    title: businessName ? `Turneiro | ${businessName}` : 'Turneiro',
  }
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
