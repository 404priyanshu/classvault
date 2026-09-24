import { ImageResponse } from 'next/og'
import { OgVaultMark } from '@/lib/brand/og-mark'

export const alt = 'ClassVault: good notes, great company. Early access at Bennett University.'
export const size = { height: 630, width: 1200 }
export const contentType = 'image/png'

/**
 * The preview WhatsApp, Telegram, and X draw when a ClassVault link is
 * shared. Pilot invites travel as links in group chats, so this is most
 * students' first look at the product.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#5b5fd7',
          color: '#fffdf5',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '72px 80px',
          width: '100%',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 22 }}>
          <OgVaultMark color="#fffdf5" size={72} />
          <div style={{ fontSize: 56, letterSpacing: -2 }}>ClassVault</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 92, letterSpacing: -3, lineHeight: 1 }}>
            Good notes.
          </div>
          <div style={{ fontSize: 92, letterSpacing: -3, lineHeight: 1 }}>
            Great company.
          </div>
          <div style={{ color: '#fff1a8', fontSize: 92, letterSpacing: -3, lineHeight: 1 }}>
            You&rsquo;ve got this.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 32, opacity: 0.92 }}>
          Notes, plans, and study rooms · Early access at Bennett
        </div>
      </div>
    ),
    size,
  )
}
