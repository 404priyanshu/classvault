import type { Metadata } from 'next'
import { Caveat, Fraunces, Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
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

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})

export const metadata: Metadata = {
  title: 'ClassVault — Study Together, Smarter',
  description:
    'ClassVault is the study platform for Indian college students: rated notes, verified university communities, live study rooms, and personalized study roadmaps.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${caveat.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
