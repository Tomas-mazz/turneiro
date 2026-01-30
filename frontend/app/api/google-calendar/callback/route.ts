import { NextRequest, NextResponse } from 'next/server'

/**
 * Google OAuth redirects here with code and state.
 * Forward to backend so it can exchange the code and redirect user to dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/dashboard?google_calendar_error=1`)
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const backendCallback = `${apiUrl}/api/google-calendar/callback?${searchParams.toString()}`
  return NextResponse.redirect(backendCallback)
}
