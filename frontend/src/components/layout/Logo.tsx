export function Logo({ size = 34, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.29,
        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-float)', flexShrink: 0,
      }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 32 32" fill="none">
          <path d="M8.5 16.5L13 21L23.5 11.5" stroke="var(--dark)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.4px', lineHeight: 1 }}>
        <span style={{ color: onDark ? '#fff' : 'var(--text-primary)', fontWeight: 700 }}>Task</span>
        <span style={{ color: 'var(--accent)', fontWeight: 900 }}>ont</span>
      </span>
    </div>
  )
}
