'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/setting')
  }, [router])
  return (
    <main className="flex min-h-[40vh] items-center justify-center p-8">
      <p className="text-neutral-500">Redirigiendo...</p>
    </main>
  )
}
