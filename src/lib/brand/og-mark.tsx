/**
 * The VaultMark for next/og images. Satori renders inline SVG but not CSS
 * modules, so this repeats the four folded leaves with plain attributes.
 */
export function OgVaultMark({ color, size }: { color: string; size: number }) {
  const leaf = 'M10 6h21l9 9-8 8-7-7h-9v9L6 15v-5a4 4 0 0 1 4-4Z'
  return (
    <svg height={size} viewBox="0 0 64 64" width={size}>
      {[0, 90, 180, 270].map((angle) => (
        <path d={leaf} fill={color} key={angle} transform={`rotate(${angle} 32 32)`} />
      ))}
    </svg>
  )
}
