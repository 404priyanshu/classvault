import { ImageResponse } from 'next/og'
import { OgVaultMark } from '@/lib/brand/og-mark'

export const size = { height: 180, width: 180 }
export const contentType = 'image/png'

/** The home-screen icon; iOS ignores SVG icons and rounds the corners itself. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#5b5fd7',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <OgVaultMark color="#fffdf5" size={120} />
      </div>
    ),
    size,
  )
}
