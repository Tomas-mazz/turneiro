'use client'

import Link from 'next/link'

export default function SellerHomePage() {
  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 border-b border-neutral-200 pb-4">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Panel vendedor</h1>
        <p className="text-sm text-neutral-600">
          Creá negocios y cargá la información básica para que el owner pueda empezar.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/seller/businesses"
          className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Mis negocios</p>
          <p className="mt-1 text-sm text-neutral-600">Ver y editar negocios creados por vos.</p>
        </Link>
        <Link
          href="/seller/businesses/new"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm hover:bg-emerald-100"
        >
          <p className="text-sm font-semibold text-emerald-900">Crear negocio</p>
          <p className="mt-1 text-sm text-emerald-800">Cargar datos base y credenciales del owner.</p>
        </Link>
      </section>
    </main>
  )
}

