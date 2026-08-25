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

// Production-only because Next.js dev overlays require 'unsafe-eval'.
const productionContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' stays required by Next.js hydration/flight inline scripts
  // and by Framer Motion inline styles. challenges.cloudflare.com serves the
  // Turnstile widget script and frame.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // Chrome renders a PDF <object> in a nested browsing context, which frame-src
  // governs rather than object-src, so note previews need Storage listed here
  // too or they silently fail to paint.
  'frame-src https://challenges.cloudflare.com https://*.supabase.co',
  // Note previews embed private signed Storage URLs through <object>.
  'object-src https://*.supabase.co',
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
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
