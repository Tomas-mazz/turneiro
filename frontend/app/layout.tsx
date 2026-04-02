import type { Metadata } from 'next'
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
  title: 'Turneiro',
  description: 'Turneiro - plataforma de reservas',
  verification: {
    google: 'uSv3BhswGG0gLTYDKUe5o0VAgoGj5JeKgU4qSEB1sSo',
  },
  icons: {
    icon: '/logos/pngegg.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${montserrat.variable} ${inter.variable} ${poppins.variable} ${nunito.variable} ${playfair.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
