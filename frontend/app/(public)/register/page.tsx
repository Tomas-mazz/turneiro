'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { setAuthToken, setAuthUser } from '@/lib/auth'

type RegisterResponse = {
  token: string
  user: { id: string; email: string; role: string; businessId: string | null }
}

function getStoreSlugFromHost(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname.toLowerCase().split(':')[0]
  if (hostname.endsWith('.localhost')) {
    const base = hostname.replace(/\.localhost$/, '')
    return base || null
  }
  if (hostname.endsWith('.turneros.com')) {
    const base = hostname.replace(/\.turneros\.com$/, '')
    return base || null
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG ?? null
  }
  return null
}

function isAppleUser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Macintosh|Mac OS X|iPhone|iPad/.test(navigator.userAgent)
}

export default function RegisterPage() {
  const router = useRouter()
  const [storeSlug, setStoreSlug] = useState<string | null>(null)
  const [slugReady, setSlugReady] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const showApple = isAppleUser()

  useEffect(() => {
    setStoreSlug(getStoreSlugFromHost())
    setSlugReady(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeSlug) {
      setError('No se pudo determinar la tienda. Entrá desde el enlace de la tienda.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<RegisterResponse>('/auth/register', {
        name,
        email,
        password,
        businessSlug: storeSlug,
      })
      setAuthToken(res.data.token)
      setAuthUser(res.data.user)
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (!slugReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
          <p className="text-center text-neutral-600">Cargando...</p>
        </div>
      </main>
    )
  }

  if (!storeSlug) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
          <p className="text-center text-neutral-600">
            Entrá desde el enlace de la tienda para registrarte (ej. vasco-barber.localhost o tu tienda en turneros.com).
          </p>
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-neutral-900 underline underline-offset-2">
              Volver
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-neutral-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Nombre, email y contraseña
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-neutral-700">
              Nombre
            </label>
            <input
              id="register-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              autoComplete="name"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-neutral-900 py-2.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-neutral-400">
          <span className="flex-1 border-t border-current opacity-50" />
          <span className="text-xs font-medium">o</span>
          <span className="flex-1 border-t border-current opacity-50" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 text-sm font-medium text-neutral-500 opacity-70"
            title="Próximamente"
          >
            Registrarse con Google
          </button>
          {showApple && (
            <button
              type="button"
              disabled
              className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 text-sm font-medium text-neutral-500 opacity-70"
              title="Próximamente"
            >
              Registrarse con Apple
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-neutral-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/" className="font-medium text-neutral-900 underline underline-offset-2 hover:no-underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
