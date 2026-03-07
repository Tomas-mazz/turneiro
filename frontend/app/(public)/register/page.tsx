'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { setAuthToken, setAuthUser } from '@/lib/auth'
import { SocialLoginButtons } from '@/app/(public)/[business-slug]/components/SocialLoginButtons'

type RegisterResponse = {
  token: string
  user: { id: string; email: string; role: string; businessId: string | null; name?: string | null }
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

export default function RegisterPage() {
  const router = useRouter()
  const [storeSlug, setStoreSlug] = useState<string | null>(null)
  const [slugReady, setSlugReady] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  const mainClass = 'flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300'
  const mainStyle = { backgroundColor: 'hsl(0, 0%, 9%)' }
  const cardClass = 'w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-800 p-6 shadow-xl'
  const titleClass = 'text-xl font-semibold text-white'
  const subClass = 'text-sm text-neutral-400'
  const labelClass = 'block text-sm font-medium text-neutral-300'
  const inputClass =
    'mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-700/80 px-3 py-2.5 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'

  if (!slugReady) {
    return (
      <main className={mainClass} style={mainStyle}>
        <div className={cardClass}>
          <p className="text-center text-neutral-400">Cargando...</p>
        </div>
      </main>
    )
  }

  if (!storeSlug) {
    return (
      <main className={mainClass} style={mainStyle}>
        <div className={cardClass}>
          <p className="text-center text-neutral-400">
            Entrá desde el enlace de la tienda para registrarte (ej. vasco-barber.localhost o tu tienda en turneros.com).
          </p>
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-neutral-300 underline underline-offset-2 hover:text-white">
              Volver
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={mainClass} style={mainStyle}>
      <div className={cardClass}>
        <h1 className={titleClass}>Crear cuenta</h1>
        <p className={`mt-1 ${subClass}`}>Nombre, email y contraseña</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="register-name" className={labelClass}>
              Nombre
            </label>
            <input
              id="register-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoComplete="name"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="register-email" className={labelClass}>
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="register-password" className={labelClass}>
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <SocialLoginButtons storeSlug={storeSlug} isDarkTheme />

        <p className={`mt-4 text-center text-sm text-neutral-400`}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/" className="font-medium text-neutral-300 underline underline-offset-2 hover:text-white">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
