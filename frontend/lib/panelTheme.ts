/**
 * Turneiro panel UI — barra lateral: texto siempre blanco (activo e inactivo).
 */
export const panel = {
  /** Barra lateral oscura (evitar bg-[hsl(...)] arbitrario: las comas pueden romper el JIT y dejar el fondo sin aplicar). */
  sidebarBg: 'bg-neutral-950',
  sidebarBorder: 'border-neutral-800',
  navBorder: 'border-neutral-700',
  /** Encabezados chicos en sidebar — blanco suave */
  labelMuted: 'text-white/80',
  /** Ítems no seleccionados: mismo blanco que el activo; solo cambia el fondo al hover */
  navInactive: 'text-white hover:bg-neutral-800',
  navActive: 'bg-neutral-700 text-white',
  footerLink: 'text-white hover:text-white',
  outlineBtn:
    'rounded-lg border border-neutral-600 px-3 py-2 text-left text-xs font-medium text-white hover:bg-neutral-800/80',
  mobileBar:
    'border-t border-neutral-900 bg-neutral-950 shadow-[0_-6px_18px_rgba(0,0,0,0.5)] supports-[backdrop-filter]:bg-neutral-950/90',
  sheet:
    'rounded-2xl border border-neutral-700 bg-neutral-950 shadow-[0_-18px_60px_rgba(0,0,0,0.65)]',
  sheetSection: 'bg-neutral-950/60 text-white/75',
  sheetRowHover: 'text-white hover:bg-neutral-800',
  sheetRowActive: 'bg-neutral-700 text-white',
  contentBg: 'bg-neutral-100',
  card: 'rounded-xl border border-neutral-200 bg-white shadow-sm',
  cardAccent:
    'rounded-xl border border-neutral-700 bg-neutral-900 p-4 sm:p-5 text-neutral-100',
  primaryBtn: 'bg-neutral-800 text-white hover:bg-neutral-700 disabled:bg-neutral-300',
  inputFocus: 'focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500',
} as const
