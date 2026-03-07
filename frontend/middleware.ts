import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_FILE = /\.(.*)$/
const DEV_DEFAULT_STORE_SLUG = process.env.NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG

function getStoreSlugFromHost(hostname: string): string | null {
  const lowerHost = hostname.toLowerCase()

  // Local dev: explicit localhost (no subdomain) – handled separately using DEV_DEFAULT_STORE_SLUG.
  if (lowerHost === 'localhost' || lowerHost === '127.0.0.1') {
    return null
  }

  // Local dev: {storeSlug}.localhost:3000
  if (lowerHost.endsWith('.localhost')) {
    const withoutPort = lowerHost.split(':')[0]
    const base = withoutPort.replace(/\.localhost$/, '')
    return base || null
  }

  // Production: {storeSlug}.turneros.com
  if (lowerHost.endsWith('.turneros.com')) {
    const withoutPort = lowerHost.split(':')[0]
    const base = withoutPort.replace(/\.turneros\.com$/, '')
    return base || null
  }

  return null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip requests for public files (e.g. /favicon.ico, /robots.txt, etc.).
  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  const hostHeader = req.headers.get('host')
  const hostname = (hostHeader ? hostHeader.split(':')[0] : req.nextUrl.hostname) || ''

  // Do not interfere with global or internal routes.
  const excludedPrefixes = [
    '/dashboard',
    '/setting',
    '/admin',
    '/login',
    '/register',
    '/auth',
    '/booking',
    '/cancel',
    '/api',
    '/_next',
  ]

  if (
    excludedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next()
  }

  // Dev convenience: on plain localhost, use a default store slug if configured.
  if (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    pathname === '/' &&
    DEV_DEFAULT_STORE_SLUG
  ) {
    const url = req.nextUrl.clone()
    url.pathname = `/${DEV_DEFAULT_STORE_SLUG}`
    return NextResponse.rewrite(url)
  }

  const storeSlug = getStoreSlugFromHost(hostname)

  // On store subdomains, map "/" to the store's public booking page (/[business-slug]).
  if (storeSlug && pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = `/${storeSlug}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

