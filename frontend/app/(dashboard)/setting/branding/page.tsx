'use client'

import { useEffect, useState } from 'react'
import { getBusinessInfo, updateBusinessInfo } from '@/lib/api'
import type { BusinessInfo } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useBusinessLogo } from '@/lib/businessLogoContext'

type Field = {
  key: keyof BusinessInfo
  label: string
  placeholder: string
  help?: string
  type?: 'text' | 'tel' | 'url' | 'textarea'
}

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: 'Datos del negocio',
    description: 'Se muestran en la portada y en la barra de información de tu página de reservas.',
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Barbería Gral Paz' },
      {
        key: 'description',
        label: 'Descripción',
        placeholder: 'Cortes clásicos y modernos en el corazón de Córdoba.',
        type: 'textarea',
      },
      { key: 'phone', label: 'Teléfono', placeholder: '+54 351 123-4567', type: 'tel' },
      { key: 'address', label: 'Dirección', placeholder: 'Av. Colón 1234, Córdoba' },
    ],
  },
  {
    title: 'Redes y enlaces',
    description: 'Los que dejes vacíos no aparecen en tu página.',
    fields: [
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        placeholder: '+54 9 351 123 4567',
        help: 'Con código de país. Tus clientes te escriben con un toque.',
        type: 'tel',
      },
      { key: 'instagram', label: 'Instagram', placeholder: '@tubarberia', help: 'Tu usuario o el link a tu perfil.' },
      { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tubarberia', type: 'url' },
      {
        key: 'mapsUrl',
        label: 'Link de Google Maps',
        placeholder: 'https://maps.app.goo.gl/...',
        help: 'Opcional. Si lo dejás vacío, usamos la dirección.',
        type: 'url',
      },
      {
        key: 'googleReviewsUrl',
        label: 'Reseñas de Google',
        placeholder: 'https://g.page/r/.../review',
        help: 'Link a tus reseñas para que los clientes vean tu puntaje.',
        type: 'url',
      },
    ],
  },
]

const EMPTY: Record<keyof BusinessInfo, string> = {
  name: '',
  description: '',
  phone: '',
  address: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  mapsUrl: '',
  googleReviewsUrl: '',
}

function toForm(info: BusinessInfo): Record<keyof BusinessInfo, string> {
  const form = { ...EMPTY }
  for (const key of Object.keys(EMPTY) as (keyof BusinessInfo)[]) form[key] = info[key] ?? ''
  if (form.instagram) form.instagram = `@${form.instagram}`
  if (form.whatsapp) form.whatsapp = `+${form.whatsapp}`
  return form
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500'

/** Business info and social links shown on the public booking page. */
export default function BusinessInfoPage() {
  const businessLogo = useBusinessLogo()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getBusinessInfo()
      .then((info) => setForm(toForm(info)))
      .catch((err) => setLoadError(err?.response?.data?.error || 'Error al cargar la información'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      // The backend normalizes everything (WhatsApp digits, Instagram handle, empty → null).
      const updated = await updateBusinessInfo(form)
      setForm(toForm(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner logo={businessLogo} bgColor="bg-neutral-100" fullScreen={false} />
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">{loadError}</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Información y redes</h1>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{section.description}</p>
            </div>
            {section.fields.map((field) => (
              <div key={field.key}>
                <label htmlFor={`info-${field.key}`} className="mb-1 block text-sm font-medium text-neutral-700">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`info-${field.key}`}
                    rows={3}
                    maxLength={1000}
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className={inputClass}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    id={`info-${field.key}`}
                    type={field.type ?? 'text'}
                    required={field.key === 'name'}
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className={inputClass}
                    placeholder={field.placeholder}
                  />
                )}
                {field.help && <p className="mt-1 text-xs text-neutral-500">{field.help}</p>}
              </div>
            ))}
          </section>
        ))}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            saved ? 'bg-emerald-600' : 'bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-300'
          }`}
        >
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
