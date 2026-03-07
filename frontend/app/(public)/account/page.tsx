'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser, isAuthenticated } from '@/lib/auth'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
      return
    }
    const u = getAuthUser()
    if (u?.role !== 'USER') {
      router.replace('/')
      return
    }
    setUser(u)
    setChecked(true)
  }, [router])

  if (!checked || !user) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[40vh] max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900">Mi cuenta</h1>
      <p className="mt-2 text-neutral-600">
        Aquí podrás ver y editar tus datos. (Próximamente.)
      </p>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-500">Email</p>
        <p className="font-medium text-neutral-900">{user.email}</p>
        {user.name && (
          <>
            <p className="mt-3 text-sm text-neutral-500">Nombre</p>
            <p className="font-medium text-neutral-900">{user.name}</p>
          </>
        )}
      </div>
    </main>
  )
}
