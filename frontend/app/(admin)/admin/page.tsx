'use client'

import Link from 'next/link'

export default function AdminPage() {
  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4 sm:mb-8 sm:pb-6">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Gestión de negocios, servicios, horarios y reglas de pago.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-neutral-600">
          Aquí irán las funciones de admin (lista de negocios, edición, bloqueos, etc.).
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          <Link href="/login" className="underline hover:text-neutral-700">
            Volver al login
          </Link>
        </p>
      </section>
    </main>
  )
}
