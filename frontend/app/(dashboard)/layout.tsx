'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    setAllowed(true)
  }, [router])

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    )
  }

  if (!allowed) {
    return null
  }

  return <>{children}</>
}
