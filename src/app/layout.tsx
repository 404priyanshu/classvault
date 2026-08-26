import type { Metadata } from 'next'
import { Caveat, Fraunces, Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
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

export const metadata: Metadata = {
  title: 'ClassVault — Trusted Notes, Cited Plans, Shared Focus',
  description:
    'ClassVault helps Indian college students discover trusted notes, build source-cited study roadmaps, and stay in sync through realtime study rooms.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${sourceSerif.variable}`}>
        {children}
      </body>
    </html>
  )
}
