'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, getAuthUser } from '@/lib/auth'
import { getMyBusiness } from '@/lib/api'

type DashboardRole = 'OWNER' | 'STAFF' | null

type NavItem = {
  id: 'home' | 'services' | 'hours' | 'block' | 'cancel'
  label: string
  href: string
}

const OWNER_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', href: '/dashboard' },
  { id: 'services', label: 'Servicios', href: '/dashboard/services' },
  { id: 'hours', label: 'Horarios', href: '/dashboard/hours' },
  { id: 'block', label: 'Bloquear días u horarios', href: '/dashboard/blocking' },
  { id: 'cancel', label: 'Cancelar turnos', href: '/dashboard/cancel' },
]

const STAFF_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', href: '/dashboard' },
  { id: 'block', label: 'Bloquear días u horarios', href: '/dashboard/blocking' },
  { id: 'cancel', label: 'Cancelar turnos', href: '/dashboard/cancel' },
]

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DashboardRole>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const user = getAuthUser()
    if (user?.role === 'OWNER' || user?.role === 'STAFF') {
      setRole(user.role)
    } else {
      setRole(null)
    }
  }, [])

  useEffect(() => {
    getMyBusiness()
      .then((b) => {
        setBusinessName(b.name)
        setBusinessSlug(b.slug)
      })
      .catch(() => {
        setBusinessName(null)
        setBusinessSlug(null)
      })
  }, [])

  const items = role === 'OWNER' ? OWNER_ITEMS : STAFF_ITEMS

  const effectivePath = pathname || '/dashboard'

  const handleNavClick =
    (item: NavItem) =>
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      setIsMoreOpen(false)
      if (item.href !== pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        router.push(item.href)
      }
    }

  return (
    <div className="flex h-screen bg-neutral-100">
      <aside className="hidden w-72 shrink-0 flex-col justify-between bg-sky-700 text-sky-50 md:flex">
        <div className="flex flex-col gap-6 px-4 py-5">
          <div className="border-b border-sky-600 pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-200">
              Tu negocio
            </p>
            <p className="mt-1 text-sm font-semibold text-white line-clamp-2">
              {businessName ?? 'Configuración'}
            </p>
          </div>
          <nav className="space-y-1 text-sm">
            {items.map((item) => {
              const isActive =
                item.id === 'home'
                  ? effectivePath === '/dashboard' || effectivePath === '/dashboard/'
                  : effectivePath.startsWith(item.href)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleNavClick(item)}
                  className={`flex w-full items-center rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-sky-500/90 text-white'
                      : 'text-sky-100 hover:bg-sky-600/70 hover:text-white'
                  } ${
                    item.id === 'block' && role === 'OWNER'
                      ? 'ml-4 px-2 py-1.5 text-xs'
                      : 'px-3 py-2 text-sm'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <div className="border-t border-sky-600 px-4 py-4">
          {businessSlug && (
            <Link
              href="/"
              onClick={(event) => {
                event.stopPropagation()
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-50 hover:text-white"
            >
              <span aria-hidden>←</span>
              Volver a la página principal
            </Link>
          )}
        </div>
      </aside>

      <div className="relative flex h-full flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">{children}</div>

        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sky-800 bg-sky-700/95 px-3 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-1">
            {items.slice(0, 2).map((item) => {
              const isActive =
                item.id === 'home'
                  ? effectivePath === '/dashboard' || effectivePath === '/dashboard/'
                  : effectivePath.startsWith(item.href)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleNavClick(item)}
                  className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-medium ${
                    isActive ? 'text-white' : 'text-sky-100'
                  }`}
                >
                  <span className="truncate">
                    {item.id === 'block' ? 'Bloquear' : item.label}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium ${
                isMoreOpen ? 'text-white' : 'text-sky-100'
              }`}
            >
              <span className="truncate">Más</span>
              <span className="text-[0.65rem]">
                {isMoreOpen ? '▲' : '▼'}
              </span>
            </button>
          </div>
        </nav>

        {isMoreOpen && (
          <div className="fixed inset-x-0 bottom-12 z-30 mx-auto max-w-md px-3 pb-3 md:hidden">
            <div className="overflow-hidden rounded-2xl border border-sky-600 bg-sky-700 shadow-xl">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-100">
                Más opciones
              </div>
              <div className="border-t border-sky-600">
                {items.map((item) => {
                  const isActive =
                    item.id === 'home'
                      ? effectivePath === '/dashboard' || effectivePath === '/dashboard/'
                      : effectivePath.startsWith(item.href)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleNavClick(item)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                        isActive
                          ? 'bg-sky-500 text-white'
                          : 'text-sky-50 hover:bg-sky-600'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  )
                })}
                {businessSlug && (
                  <Link
                    href="/"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex w-full items-center justify-between border-t border-sky-600 px-4 py-2.5 text-left text-sm text-sky-50 hover:bg-sky-600"
                  >
                    <span>Ir a la página principal</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
    if (getAuthUser()?.role === 'ADMIN') {
      router.replace('/admin')
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

  return <DashboardShell>{children}</DashboardShell>
}
