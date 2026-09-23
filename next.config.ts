import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

// A production build pointed at the local Supabase stack (the signed-in e2e
// suite) talks to http://127.0.0.1:54321 and its ws:// Realtime socket, which
// *.supabase.co does not cover, and upgrade-insecure-requests would rewrite
// both to https. Hosted builds are
// unaffected: their URL is already a *.supabase.co origin.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const localSupabaseOrigin =
  supabaseUrl && /^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(supabaseUrl)
    ? new URL(supabaseUrl).origin
    : null
const storageSources = localSupabaseOrigin
  ? `https://*.supabase.co ${localSupabaseOrigin}`
  : 'https://*.supabase.co'
const realtimeSources = localSupabaseOrigin
  ? `wss://*.supabase.co ${localSupabaseOrigin.replace(/^http/, 'ws')}`
  : 'wss://*.supabase.co'

// Production-only because Next.js dev overlays require 'unsafe-eval'.
const productionContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' stays required by Next.js hydration/flight inline scripts
  // and by Framer Motion inline styles. challenges.cloudflare.com serves the
  // Turnstile widget script and frame.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${storageSources}`,
  "font-src 'self'",
  `connect-src 'self' ${storageSources} ${realtimeSources}`,
  // Chrome renders a PDF <object> in a nested browsing context, which frame-src
  // governs rather than object-src, so note previews need Storage listed here
  // too or they silently fail to paint.
  `frame-src https://challenges.cloudflare.com ${storageSources}`,
  // Note previews embed private signed Storage URLs through <object>.
  `object-src ${storageSources}`,
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(localSupabaseOrigin ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/profile-avatars/**',
        protocol: 'https',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Content-Security-Policy',
                  value: productionContentSecurityPolicy,
                },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
