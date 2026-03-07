'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { setAuthToken, setAuthUser } from '@/lib/auth'

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')
    if (error) {
      setMessage(decodeURIComponent(error))
      setStatus('error')
      return
    }
    if (!token) {
      setMessage('Faltan datos de sesión. Intentá iniciar sesión de nuevo.')
      setStatus('error')
      return
    }
    setAuthToken(token)
    api
      .get<{ id: string; email: string; role: string; businessId: string | null; name?: string | null }>('/auth/me')
      .then((res) => {
        setAuthUser(res.data)
        setStatus('ok')
        router.replace('/')
        router.refresh()
      })
      .catch(() => {
        setMessage('No se pudo cargar tu sesión. Intentá de nuevo.')
        setStatus('error')
      })
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-4">
        <p className="text-neutral-400">Iniciando sesión...</p>
      </main>
    )
  }
  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-4">
        <p className="text-center text-red-400">{message}</p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-neutral-300 underline underline-offset-2 hover:text-white"
        >
          Volver a la tienda
        </Link>
      </main>
    )
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-4">
      <p className="text-neutral-400">Redirigiendo...</p>
    </main>
  )
}
