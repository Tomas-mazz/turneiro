// Auth utilities for token and user (role) management

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
/** When ADMIN logs in from a store subdomain, owner API calls use this slug (header). */
const ADMIN_ACTING_SHOP_SLUG_KEY = 'admin_acting_shop_slug'

export type AuthUser = { id: string; email: string; role: string; businessId: string | null; name?: string | null }

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(ADMIN_ACTING_SHOP_SLUG_KEY)
}

export function getAdminActingShopSlug(): string | null {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem(ADMIN_ACTING_SHOP_SLUG_KEY)
  return s?.trim() || null
}

export function setAdminActingShopSlug(slug: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_ACTING_SHOP_SLUG_KEY, slug.trim())
}

export function clearAdminActingShopSlug(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_ACTING_SHOP_SLUG_KEY)
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
