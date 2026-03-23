'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import {
  getMyBusiness,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
} from '@/lib/api'
import { panel } from '@/lib/panelTheme'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com'

export default function SettingPage() {
  const [businessTitle, setBusinessTitle] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarMessage, setCalendarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const user = getAuthUser()
    setUserRole(user?.role ?? null)

    getMyBusiness()
      .then((b) => {
        setBusinessTitle(`${b.name} - Configuración`)
        setBusinessSlug(b.slug)
      })
      .catch(() => setBusinessTitle('Configuración'))

    getGoogleCalendarStatus()
      .then((data) => setCalendarConnected(data.connected))
      .catch(() => setCalendarConnected(false))
  }, [])

  useEffect(() => {
    const connected = searchParams.get('google_calendar')
    const err = searchParams.get('google_calendar_error')
    if (connected === 'connected') {
      setCalendarMessage({ type: 'success', text: 'Google Calendar conectado correctamente.' })
      setCalendarConnected(true)
      window.history.replaceState({}, '', '/setting')
    } else if (err) {
      const messages: Record<string, string> = {
        '1': 'No se pudo conectar Google Calendar. Intentá de nuevo.',
        '2': 'No se recibió autorización. Revocá el acceso y autorizá de nuevo.',
        '3': 'No se encontró calendario. Asegurate de tener Google Calendar habilitado.',
      }
      setCalendarMessage({ type: 'error', text: messages[err] || messages['1'] })
      window.history.replaceState({}, '', '/setting')
    }
  }, [searchParams])

  const handleConnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      // Pass full URL (including subdomain) so OAuth redirects back here
      const returnUrl = window.location.origin + '/setting'
      const { authUrl } = await getGoogleCalendarAuthUrl(returnUrl)
      window.location.href = authUrl
    } catch {
      setCalendarMessage({
        type: 'error',
        text: 'Error al iniciar la conexión. Intentá de nuevo.',
      })
      setCalendarLoading(false)
    }
  }

  const handleDisconnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      await disconnectGoogleCalendar()
      setCalendarConnected(false)
      setCalendarMessage({ type: 'success', text: 'Google Calendar desconectado.' })
    } catch {
      setCalendarMessage({
        type: 'error',
        text: 'Error al desconectar. Intentá de nuevo.',
      })
    } finally {
      setCalendarLoading(false)
    }
  }

  const cards =
    userRole === 'OWNER'
      ? [
          {
            id: 'services',
            title: 'Servicios',
            description:
              'Actualizá el precio y la duración de cada servicio que ofrecés en tu negocio.',
            href: '/setting/services',
          },
          {
            id: 'payments',
            title: 'Pagos',
            description:
              'Configurá si el pago es obligatorio, opcional o sólo confirmación, y cargá tus credenciales de Mercado Pago.',
            href: '/setting/payments',
          },
          {
            id: 'hours',
            title: 'Horarios',
            description:
              'Definí el horario de apertura y cierre de cada día, incluyendo pausas donde no se atiende.',
            href: '/setting/hours',
          },
          {
            id: 'blocking',
            title: 'Bloquear días u horarios',
            description:
              'Bloqueá días completos o rangos horarios para que no aparezcan como disponibles en la página de reservas.',
            href: '/setting/blocking',
          },
          {
            id: 'cancel',
            title: 'Cancelar turnos',
            description:
              'Buscá turnos por teléfono, cancelalos con un motivo y sincronizá los cambios con Google Calendar.',
            href: '/setting/cancel',
          },
        ]
      : [
          {
            id: 'blocking',
            title: 'Bloquear días u horarios',
            description:
              'Indicá cuándo no estás disponible para que esos horarios no se ofrezcan en las reservas.',
            href: '/setting/blocking',
          },
          {
            id: 'cancel',
            title: 'Cancelar turnos',
            description:
              'Buscá tus turnos asignados por teléfono y cancelalos con un motivo obligatorio.',
            href: '/setting/cancel',
          },
        ]

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4 sm:mb-8 sm:pb-6">
        {businessTitle && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              {businessTitle}
            </h1>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
            >
              <span aria-hidden>←</span>
              Ir a la página principal
            </Link>
          </div>
        )}
      </header>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
          Tu panel
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Usá estas secciones para administrar tu día a día: ajustar servicios, bloquear horarios y
          cancelar turnos de forma ordenada.
        </p>
      </section>

      {calendarMessage && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            calendarMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {calendarMessage.text}
          <button
            type="button"
            onClick={() => setCalendarMessage(null)}
            className="ml-2 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <section className="mb-8 rounded-xl border border-sky-100 bg-sky-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-sky-900 sm:text-lg">
              Conectá tu Google Calendar
            </h2>
            <p className="mt-1 text-sm text-sky-900/80">
              Sincronizá tus turnos con Google Calendar para ver todo en un solo lugar. Las
              cancelaciones que hagas desde este panel también se reflejan en tu calendario.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {calendarConnected ? (
              <>
                <a
                  href={GOOGLE_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-50"
                >
                  Ver Google Calendar
                </a>
                <button
                  type="button"
                  disabled={calendarLoading}
                  onClick={handleDisconnectGoogleCalendar}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  {calendarLoading ? 'Desconectando...' : 'Desconectar'}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={calendarLoading}
                onClick={handleConnectGoogleCalendar}
                className="rounded-lg border border-sky-300 bg-white px-4 py-2.5 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-50 disabled:opacity-50"
              >
                {calendarLoading ? 'Redirigiendo...' : 'Conectar Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Secciones disponibles
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group flex h-full flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
            >
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {card.description}
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-neutral-800 group-hover:text-neutral-950">
                Ir a esta sección
                <span aria-hidden className="ml-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
