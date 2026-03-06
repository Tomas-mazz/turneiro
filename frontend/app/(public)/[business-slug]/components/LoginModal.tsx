'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'

type LoginResponse = {
  token: string
  user: { id: string; email: string; role: string; businessId: string | null }
}

type LoginModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (user: AuthUser, token: string) => void
  onOpenRegister: () => void
  isDarkTheme?: boolean
}

function isAppleUser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Macintosh|Mac OS X|iPhone|iPad/.test(navigator.userAgent)
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
  onOpenRegister,
  isDarkTheme = true,
}: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const showApple = isAppleUser()

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

  const panelBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white'
  const panelBorder = isDarkTheme ? 'border-neutral-600' : 'border-neutral-200'
  const titleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const labelColor = isDarkTheme ? 'text-neutral-300' : 'text-neutral-700'
  const inputClass = isDarkTheme
    ? 'w-full rounded-lg border border-neutral-600 bg-neutral-700/80 px-3 py-2.5 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'
    : 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'
  const dividerColor = isDarkTheme ? 'text-neutral-500' : 'text-neutral-400'
  const linkColor = isDarkTheme ? 'text-neutral-300 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
  const closeBtn = isDarkTheme
    ? 'border-neutral-500 text-neutral-300 hover:bg-neutral-600 hover:text-white'
    : 'border-neutral-400 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'

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
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="login-modal-title" className={`text-xl font-semibold ${titleColor}`}>
            Iniciar sesión
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${closeBtn}`}
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
            className="w-full rounded-lg bg-neutral-900 py-2.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className={`my-4 flex items-center gap-3 ${dividerColor}`}>
          <span className="flex-1 border-t border-current opacity-50" />
          <span className="text-xs font-medium">o</span>
          <span className="flex-1 border-t border-current opacity-50" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-500 bg-neutral-700/50 py-2.5 text-sm font-medium text-neutral-400 opacity-70"
            title="Próximamente"
          >
            Continuar con Google
          </button>
          {showApple && (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-500 bg-neutral-700/50 py-2.5 text-sm font-medium text-neutral-400 opacity-70"
              title="Próximamente"
            >
              Continuar con Apple
            </button>
          )}
        </div>

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
