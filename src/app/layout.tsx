import type { Metadata } from 'next'
import { Caveat, Inter, Source_Serif_4 } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Landing headings only. A text serif reads as a paper or a textbook, which is
// the register the marketing page is aiming for; the grid, mono labels, and
// signal orange stay exactly as they are.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600'],
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})

const description =
  'ClassVault helps Indian college students discover trusted notes, build source-cited study roadmaps, and stay in sync through realtime study rooms.'

export const metadata: Metadata = {
  // Absolute URLs for the share preview; the apex redirects to www.
  metadataBase: new URL('https://www.classvault.in'),
  title: 'ClassVault — Trusted Notes, Cited Plans, Shared Focus',
  description,
  openGraph: {
    description,
    locale: 'en_IN',
    siteName: 'ClassVault',
    title: 'ClassVault — Good notes. Great company.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    description,
    title: 'ClassVault — Good notes. Great company.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={`${inter.variable} ${caveat.variable} ${sourceSerif.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
