export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.29,
        background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-float)',
      }}>
        <svg width={size * 0.59} height={size * 0.59} viewBox="0 0 32 32" fill="none">
          <path d="M8.5 16.5L13 21L23.5 11.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.4px', lineHeight: 1 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 900 }}>O</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Taska</span>
      </span>
    </div>
  )
}
