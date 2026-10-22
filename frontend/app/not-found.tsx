import Link from 'next/link'

export const metadata = { title: 'Página no encontrada | Turneiro' }

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-400">404</p>
        <h1 className="mb-3 text-2xl font-semibold text-neutral-900">
          No encontramos esta página
        </h1>
        <p className="mb-6 text-sm text-neutral-600">
          Revisá que el enlace esté bien escrito o pedile al negocio su link de reservas.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ir a Turneiro
        </Link>
      </div>
    </main>
  )
}
