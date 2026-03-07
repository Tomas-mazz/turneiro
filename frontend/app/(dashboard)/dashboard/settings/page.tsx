'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return (
    <main className="flex min-h-[40vh] items-center justify-center p-8">
      <p className="text-neutral-500">Redirigiendo a configuración...</p>
    </main>
  )
}
