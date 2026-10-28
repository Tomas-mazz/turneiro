'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getSellerBusiness,
  updateSellerBusiness,
  uploadSellerFile,
} from '@/lib/api'
import type { SellerBusinessDetail, UpdateSellerBusinessBody } from '@/types'

type FormState = {
  name: string
  slug: string
  category: string
  description: string
  phone: string
  email: string
  address: string
  logo: string
  coverPhoto: string
  coverVideo: string
  coverPhotoMobile: string
  coverVideoMobile: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

export default function SellerBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [business, setBusiness] = useState<SellerBusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<FormState>({
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
    coverPhotoMobile: '',
    coverVideoMobile: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  })

  const [coverDesktopUploading, setCoverDesktopUploading] = useState(false)
  const [coverMobileUploading, setCoverMobileUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    getSellerBusiness(id)
      .then((b) => {
        setBusiness(b)
        setForm({
          name: b.name,
          slug: b.slug,
          category: b.category,
          description: b.description ?? '',
          phone: b.phone ?? '',
          email: b.email ?? '',
          address: b.address ?? '',
          logo: b.logo ?? '',
          coverPhoto: b.coverPhoto ?? '',
          coverVideo: b.coverVideo ?? '',
          coverPhotoMobile: b.coverPhotoMobile ?? '',
          coverVideoMobile: b.coverVideoMobile ?? '',
          ownerName: b.ownerName ?? '',
          ownerEmail: b.owner?.email ?? '',
          ownerPassword: '',
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleCoverDesktopFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return
    setCoverDesktopUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setError('Error al subir el archivo')
    } finally {
      setCoverDesktopUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return
    setCoverMobileUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhotoMobile: isImage ? url : '',
        coverVideoMobile: isVideo ? url : '',
      }))
    } catch {
      setError('Error al subir el archivo')
    } finally {
      setCoverMobileUploading(false)
      e.target.value = ''
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setLogoUploading(true)
    try {
      const { url } = await uploadSellerFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setError('Error al subir el archivo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    setError(null)
    setFieldErrors({})
    setSaved(false)
    setSaving(true)
    try {
      const body: UpdateSellerBusinessBody = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        category: form.category.trim(),
      }
      body.description = form.description.trim() || null
      body.phone = form.phone.trim() || null
      body.email = form.email.trim() || null
      body.address = form.address.trim() || null
      body.logo = form.logo.trim() || null
      body.coverPhoto = form.coverPhoto.trim() || null
      body.coverVideo = form.coverVideo.trim() || null
      body.coverPhotoMobile = form.coverPhotoMobile.trim() || null
      body.coverVideoMobile = form.coverVideoMobile.trim() || null
      if (form.ownerName.trim()) body.ownerName = form.ownerName.trim()
      body.ownerEmail = form.ownerEmail.trim() || undefined
      if (form.ownerPassword.trim()) body.ownerPassword = form.ownerPassword

      await updateSellerBusiness(id, body)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; field?: string; details?: { path: (string | number)[]; message: string }[] } } }).response?.data
          : undefined
      const msg = data?.error ?? 'Error al guardar'
      setError(data?.details?.length ? 'Revisá los campos marcados.' : msg)
      const next: Record<string, string> = {}
      if (data?.details && Array.isArray(data.details)) {
        for (const d of data.details) {
          const key = typeof d.path?.[0] === 'string' ? d.path[0] : String(d.path?.[0] ?? '')
          if (key && d.message) next[key] = d.message
        }
      }
      if (data?.field && data?.error) next[data.field] = data.error
      setFieldErrors(next)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    )
  }

  if (error && !business) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <Link href="/seller/businesses" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver
        </Link>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    )
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link href="/seller/businesses" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver a mis negocios
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">Editar negocio</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {business?.name} · /{business?.slug}
        </p>
      </header>

      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Datos base</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
                Nombre *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.name && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium text-neutral-700">
                Slug *
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                value={form.slug}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.slug && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.slug}</p>}
            </div>
          </div>

          <div className="mt-4">
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
              <option value="wellness">Wellness / estética</option>
              <option value="spa">Spa</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-neutral-700">
              Dirección
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Marca (opcional)</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Portada (desktop)</label>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleCoverDesktopFile}
                disabled={coverDesktopUploading}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {(form.coverPhoto || form.coverVideo) && (
                <p className="mt-1 text-xs text-neutral-600">Portada cargada.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Portada (mobile)</label>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleCoverMobileFile}
                disabled={coverMobileUploading}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {(form.coverPhotoMobile || form.coverVideoMobile) && (
                <p className="mt-1 text-xs text-neutral-600">Portada mobile cargada.</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700">Logo</label>
            {form.logo && (
              <div className="mb-3 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo} alt="Logo" className="h-14 w-14 rounded-full border border-neutral-200 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                  className="text-sm text-red-600 underline hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              disabled={logoUploading}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">Dueño del negocio</legend>
          <p className="mb-3 text-xs text-neutral-500">
            Para cambiar contraseña, completá el campo y guardá. Si no hay owner, cargá email + contraseña.
          </p>
          <div className="mb-4">
            <label htmlFor="ownerName" className="mb-1 block text-sm text-neutral-600">
              Nombre del dueño *
            </label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
            <p className="mt-0.5 text-xs text-neutral-500">Así lo ven los clientes al reservar. No uses el email.</p>
            {fieldErrors.ownerName && (
              <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.ownerName}</p>
            )}
          </div>
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerEmail && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.ownerEmail}</p>}
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1 block text-sm text-neutral-600">
                Nueva contraseña
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                value={form.ownerPassword}
                onChange={handleChange}
                minLength={6}
                placeholder="••••••••"
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerPassword && <p className="mt-0.5 text-sm text-red-600">{fieldErrors.ownerPassword}</p>}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
              saved
                ? 'border-2 border-emerald-500 bg-emerald-500 text-white'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:scale-105 hover:bg-emerald-100'
            }`}
          >
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/seller/businesses')}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Volver
          </button>
        </div>
      </div>
    </main>
  )
}

