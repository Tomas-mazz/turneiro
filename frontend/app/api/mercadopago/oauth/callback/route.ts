import { NextRequest, NextResponse } from 'next/server'

/**
 * Mercado Pago OAuth redirects here with code and state.
 * Forward to backend so it can exchange tokens and redirect back to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/setting/payments?mercado_pago_error=missing_code`)
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const backendCallback = `${apiUrl}/api/mercadopago/oauth/callback?${searchParams.toString()}`
  return NextResponse.redirect(backendCallback)
}
