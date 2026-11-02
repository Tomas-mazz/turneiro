import type { Metadata, Viewport } from 'next'
import { Roboto, Montserrat, Inter, Poppins, Nunito, Playfair_Display } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

const nunito = Nunito({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const playfair = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  // Lets relative OG/icon URLs resolve to absolute ones, which link previews (WhatsApp) require.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://turneiro.com'),
  title: 'Turneiro',
  description: 'Turneiro — reservas online para tu negocio',
  verification: {
    google: 'uSv3BhswGG0gLTYDKUe5o0VAgoGj5JeKgU4qSEB1sSo',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2D3FE0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${roboto.variable} ${montserrat.variable} ${inter.variable} ${poppins.variable} ${nunito.variable} ${playfair.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
