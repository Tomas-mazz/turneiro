'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createAdminBusiness, uploadAdminFile } from '@/lib/api'
import type { CreateBusinessBody } from '@/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminNewBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateBusinessBody>({
    name: '',
    slug: '',
    category: 'barbershop',
    description: '',
    phone: '',
    email: '',
    address: '',
    logo: '',
    coverPhoto: '',
    coverVideo: '',
    paymentRequired: false,
    ownerEmail: '',
    ownerPassword: '',
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'name' && !form.slug) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setLogoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setError('Error al subir el logo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverUploadError('Elegí una imagen o un video')
      return
    }
    setCoverUploadError(null)
    setCoverUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setCoverUploadError('Error al subir el archivo')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const body: CreateBusinessBody = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        category: form.category.trim(),
        paymentRequired: form.paymentRequired,
        theme: 'DARK',
      }
      if (form.description?.trim()) body.description = form.description.trim()
      if (form.phone?.trim()) body.phone = form.phone.trim()
      if (form.email?.trim()) body.email = form.email.trim()
      if (form.address?.trim()) body.address = form.address.trim()
      if (form.logo?.trim()) body.logo = form.logo.trim()
      if (form.coverPhoto?.trim()) body.coverPhoto = form.coverPhoto.trim()
      if (form.coverVideo?.trim()) body.coverVideo = form.coverVideo.trim()
      if (form.ownerEmail?.trim()) body.ownerEmail = form.ownerEmail.trim()
      if (form.ownerPassword?.trim()) body.ownerPassword = form.ownerPassword

      const result = await createAdminBusiness(body)
      router.push(`/admin/businesses/${result.id}/setup`)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al crear el negocio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link
          href="/admin"
          className="text-sm text-neutral-600 underline hover:text-neutral-900"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
          Crear negocio
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Paso 1 de 5 · Datos del negocio</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Marca y presentación
          </legend>
          <p className="mb-4 text-xs text-neutral-500">
            Nombre, descripción, logo y portada se muestran en la página pública de reservas.
          </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre del negocio *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-neutral-700">
              Slug (URL) *
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={form.slug}
              onChange={handleChange}
              placeholder="ej: mi-barberia"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
            <p className="mt-0.5 text-xs text-neutral-500">
              Solo letras minúsculas, números y guiones. La página de reservas será /{form.slug || 'slug'}.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-neutral-700">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          >
            <option value="barbershop">Barbería</option>
            <option value="salon">Salón</option>
            <option value="spa">Spa</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={form.description ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email de contacto
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-neutral-700">
            Dirección
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoFile}
            disabled={logoUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {form.logo && (
            <p className="mt-1 text-sm text-green-600">
              Logo cargado. <button type="button" onClick={() => setForm((p) => ({ ...p, logo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Imagen o video de portada
          </label>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleCoverFile}
            disabled={coverUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {coverUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {coverUploadError && <p className="mt-1 text-sm text-red-600">{coverUploadError}</p>}
          {(form.coverPhoto || form.coverVideo) && (
            <p className="mt-1 text-sm text-green-600">
              Portada cargada. <button type="button" onClick={() => setForm((p) => ({ ...p, coverPhoto: '', coverVideo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Reserva con pago antes de confirmar
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Si activás &quot;Con pago&quot;, el cliente deberá pagar un depósito o el total para confirmar la reserva. El detalle (porcentaje o total) se configura después en reglas de pago.
          </p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentRequired"
                checked={!form.paymentRequired}
                onChange={() => setForm((p) => ({ ...p, paymentRequired: false }))}
                className="text-neutral-900"
              />
              <span>Sin pago antes de la reserva</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentRequired"
                checked={form.paymentRequired}
                onChange={() => setForm((p) => ({ ...p, paymentRequired: true }))}
                className="text-neutral-900"
              />
              <span>Con pago antes de la reserva</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Credenciales del dueño del negocio
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Opcional. Si los completás, el owner podrá iniciar sesión en el panel y gestionar precios, duración, Google Calendar y cancelar turnos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ownerEmail" className="mb-1 block text-sm text-neutral-600">
                Email del owner
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                value={form.ownerEmail}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1 block text-sm text-neutral-600">
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                value={form.ownerPassword}
                onChange={handleChange}
                minLength={6}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear negocio'}
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  )
}
