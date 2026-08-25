import type { Metadata } from 'next'
import { Caveat, Fraunces, Inter } from 'next/font/google'
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
      {/*
        Marks the document ready so entrance animations may attach. Inline and
        before paint, so there is no flash; if it never runs -- scripting off, a
        crawler, a failed bundle -- the animations simply do not apply and the
        content is visible as plain markup.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.setAttribute('data-ready','')",
        }}
      />
      <body className={`${inter.variable} ${fraunces.variable} ${caveat.variable}`}>
        {children}
      </body>
    </html>
  )
}
