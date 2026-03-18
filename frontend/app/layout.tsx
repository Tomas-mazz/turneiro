import type { Metadata } from 'next'
import { Roboto, Montserrat } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Turneiro',
  description: 'Turneiro - plataforma de reservas',
  verification: {
    google: 'YdT4JE6fpBkZ6lPs1e-d7LWYl87Ve1yY77JG5rLyPkw',
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
    <html lang="en" className={`${roboto.variable} ${montserrat.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
