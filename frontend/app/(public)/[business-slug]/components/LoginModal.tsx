'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import { SocialLoginButtons } from './SocialLoginButtons'

type LoginResponse = {
  token: string
  user: { id: string; email: string; role: string; businessId: string | null; name?: string | null }
}

type LoginModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (user: AuthUser, token: string) => void
  onOpenRegister: () => void
  isDarkTheme?: boolean
  storeSlug?: string | null
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
  onOpenRegister,
  isDarkTheme = true,
  storeSlug = null,
}: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      const firstInput = panelRef.current.querySelector<HTMLElement>('input')
      firstInput?.focus()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password })
      onSuccess(res.data.user, res.data.token)
      onClose()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToRegister = () => {
    onClose()
    onOpenRegister()
  }

  if (!open) return null

  const titleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const labelColor = isDarkTheme ? 'text-white/80' : 'text-neutral-700'
  const inputClass = isDarkTheme
    ? 'w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/25'
    : 'w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10'
  const linkColor = isDarkTheme ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
  const closeBtn = isDarkTheme
    ? 'text-white/85 hover:bg-white/12'
    : 'text-neutral-700 hover:bg-black/5'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="liquid-glass-panel w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="login-modal-title" className={`text-xl font-semibold ${titleColor}`}>
            Iniciar sesión
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${closeBtn}`}
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className={`block text-sm font-medium ${labelColor}`}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 ${inputClass}`}
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className={`block text-sm font-medium ${labelColor}`}>
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 ${inputClass}`}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white/90 py-2.5 font-medium text-black shadow-sm hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <SocialLoginButtons storeSlug={storeSlug} isDarkTheme={isDarkTheme} />

        <p className={`mt-4 text-center text-sm ${labelColor}`}>
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={handleGoToRegister}
            className={`font-medium underline underline-offset-2 ${linkColor}`}
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  )
}
