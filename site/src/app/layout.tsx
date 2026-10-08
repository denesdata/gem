import type { Metadata } from 'next'
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GEM Romania - Global Entrepreneurship Monitor',
  description: 'Entrepreneurship in Romania told through data visualization. Part of the Global Entrepreneurship Monitor research consortium.',
  keywords: ['entrepreneurship', 'Romania', 'GEM', 'data visualization', 'startups', 'business'],
  authors: [{ name: 'FSEGA - Babes-Bolyai University' }],
  openGraph: {
    title: 'GEM Romania - Global Entrepreneurship Monitor',
    description: 'Entrepreneurship in Romania told through data visualization',
    url: 'https://econ.ubbcluj.ro/entrepreneurship/',
    siteName: 'GEM Romania',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} antialiased`}>
        <ClientWrapper>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ClientWrapper>
      </body>
    </html>
  )
}
