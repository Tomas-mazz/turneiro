'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getBusinessSettings, getMyBusiness, updateBusinessSettings } from '@/lib/api'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'
import { PublicBrandingSection } from '../components/PublicBrandingSection'
import { PublicDefaultThemeSection } from '../components/PublicDefaultThemeSection'

type FontFamilyKey = 'ROBOTO' | 'MONTSERRAT' | 'INTER' | 'POPPINS' | 'NUNITO' | 'PLAYFAIR'

const FONT_OPTIONS: { key: FontFamilyKey; label: string; cssVar: string }[] = [
  { key: 'ROBOTO', label: 'Roboto', cssVar: 'var(--font-roboto)' },
  { key: 'MONTSERRAT', label: 'Montserrat', cssVar: 'var(--font-montserrat)' },
  { key: 'INTER', label: 'Inter', cssVar: 'var(--font-inter)' },
  { key: 'POPPINS', label: 'Poppins', cssVar: 'var(--font-poppins)' },
  { key: 'NUNITO', label: 'Nunito', cssVar: 'var(--font-nunito)' },
  { key: 'PLAYFAIR', label: 'Playfair', cssVar: 'var(--font-playfair)' },
]

export default function AppearancePage() {
  const [allowBrandingAdvanced, setAllowBrandingAdvanced] = useState<boolean | null>(null)
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>('ROBOTO')
  const [bgDarkHex, setBgDarkHex] = useState(DEFAULT_PUBLIC_PAGE_BG_DARK)
  const [bgLightHex, setBgLightHex] = useState(DEFAULT_PUBLIC_PAGE_BG_LIGHT)
  const [publicBrandColor, setPublicBrandColor] = useState<string | null>(null)
  const [publicBrandIntensity, setPublicBrandIntensity] = useState<'SOFT' | 'NORMAL' | 'STRONG'>('SOFT')
  const [publicUseGradient, setPublicUseGradient] = useState(false)
  const [publicDefaultTheme, setPublicDefaultTheme] = useState<'LIGHT' | 'DARK'>('DARK')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [restoringDefaults, setRestoringDefaults] = useState(false)
  const [justRestored, setJustRestored] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([getMyBusiness(), getBusinessSettings()])
      .then(([b, s]) => {
        const can = b.capabilities?.allowBrandingAdvanced !== false
        setAllowBrandingAdvanced(can)

        const next = String((s as any).fontFamily ?? 'ROBOTO').toUpperCase()
        if (FONT_OPTIONS.some((x) => x.key === next)) {
          setFontFamily(next as FontFamilyKey)
        } else {
          setFontFamily('ROBOTO')
        }
        setBgDarkHex(s.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
        setBgLightHex(s.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
        setPublicBrandColor(s.publicBrandColor ?? null)
        const rawIntensity = String(s.publicBrandIntensity ?? 'SOFT').toUpperCase()
        setPublicBrandIntensity(
          rawIntensity === 'STRONG' ? 'STRONG' : rawIntensity === 'NORMAL' ? 'NORMAL' : 'SOFT'
        )
        setPublicUseGradient(!!s.publicUseGradient)
        const th = String(s.theme ?? 'DARK').toUpperCase()
        setPublicDefaultTheme(th === 'LIGHT' ? 'LIGHT' : 'DARK')
        setError(null)
      })
      .catch(() => setError('No se pudo cargar la configuración.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 2500)
    return () => clearTimeout(t)
  }, [justSaved])

  useEffect(() => {
    if (!justRestored) return
    const t = setTimeout(() => setJustRestored(false), 2500)
    return () => clearTimeout(t)
  }, [justRestored])

  const sample = useMemo(() => 'El veloz murciélago hindú', [])

  const handleRestoreDefaults = async () => {
    setRestoringDefaults(true)
    setJustRestored(false)
    try {
      const updated = await updateBusinessSettings({
        publicBrandColor: null,
        publicBrandIntensity: 'SOFT',
        publicUseGradient: false,
        publicPageBackgroundDark: null,
        publicPageBackgroundLight: null,
      })
      setBgDarkHex(updated.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
      setBgLightHex(updated.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
      setPublicBrandColor(updated.publicBrandColor ?? null)
      setPublicBrandIntensity(updated.publicBrandIntensity ?? 'SOFT')
      setPublicUseGradient(!!updated.publicUseGradient)
      setJustRestored(true)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo restaurar.')
    } finally {
      setRestoringDefaults(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setJustSaved(false)
    try {
      const allowAdvanced = allowBrandingAdvanced !== false
      const updated = await updateBusinessSettings({
        fontFamily,
        theme: publicDefaultTheme,
        ...(allowAdvanced && {
          publicBrandColor,
          publicBrandIntensity,
          publicUseGradient,
          publicPageBackgroundDark: bgDarkHex === DEFAULT_PUBLIC_PAGE_BG_DARK ? null : bgDarkHex,
          publicPageBackgroundLight: bgLightHex === DEFAULT_PUBLIC_PAGE_BG_LIGHT ? null : bgLightHex,
        }),
      })
      const next = String((updated as any).fontFamily ?? fontFamily).toUpperCase()
      if (FONT_OPTIONS.some((x) => x.key === next)) setFontFamily(next as FontFamilyKey)
      setPublicDefaultTheme(updated.theme === 'LIGHT' ? 'LIGHT' : 'DARK')
      setBgDarkHex(updated.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
      setBgLightHex(updated.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
      setPublicBrandColor(updated.publicBrandColor ?? null)
      setPublicBrandIntensity(updated.publicBrandIntensity ?? 'SOFT')
      setPublicUseGradient(!!updated.publicUseGradient)
      setJustSaved(true)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4 sm:mb-8 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Fuentes y Colores</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Fuente y colores de fondo de la página pública de reserva de tu negocio.
            </p>
          </div>
          <Link
            href="/setting"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
          >
            <span aria-hidden>←</span>
            Volver
          </Link>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Cerrar
          </button>
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <p className="text-sm text-neutral-600">Cargando...</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FONT_OPTIONS.map((opt) => {
                const selected = fontFamily === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFontFamily(opt.key)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900">{opt.label}</div>
                        <div className="mt-2 text-xl text-neutral-900" style={{ fontFamily: opt.cssVar }}>
                          Aa Bb Cc
                        </div>
                        <div className="mt-1 text-sm text-neutral-700" style={{ fontFamily: opt.cssVar }}>
                          {sample}
                        </div>
                      </div>
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                        aria-hidden
                      >
                        {selected ? '✓' : ''}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {allowBrandingAdvanced === false ? null : (
              <>
                <PublicBrandingSection
                  brandColor={publicBrandColor}
                  intensity={publicBrandIntensity}
                  useGradient={publicUseGradient}
                  legacyDarkHex={bgDarkHex}
                  legacyLightHex={bgLightHex}
                  onBrandColor={setPublicBrandColor}
                  onIntensity={setPublicBrandIntensity}
                  onUseGradient={setPublicUseGradient}
                  onReset={() => {
                    setPublicBrandColor('#E24A8D')
                    setPublicBrandIntensity('SOFT')
                    setPublicUseGradient(true)
                  }}
                />

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    disabled={restoringDefaults}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
                  >
                    <span aria-hidden>{restoringDefaults ? '⏳' : justRestored ? '✓' : '↺'}</span>
                    {restoringDefaults ? 'Restaurando...' : 'Restaurar colores por defecto'}
                  </button>
                  <p className="mt-2 text-xs text-neutral-500">
                    Vuelve al estilo original: sin color de marca/gradiente y con fondo oscuro {DEFAULT_PUBLIC_PAGE_BG_DARK} / claro {DEFAULT_PUBLIC_PAGE_BG_LIGHT}.
                  </p>
                </div>
              </>
            )}

            <PublicDefaultThemeSection value={publicDefaultTheme} onChange={setPublicDefaultTheme} />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              {justSaved && <span className="text-sm font-medium text-green-700">Guardado</span>}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
