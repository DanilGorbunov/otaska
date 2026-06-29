import type { EntryStatus } from '../../types'

const colors: Record<EntryStatus, { bg: string; shadow?: string }> = {
  draft:       { bg: '#C7C7CC' },
  open:        { bg: '#111111', shadow: '0 0 0 3px rgba(0,0,0,.1)' },
  matched:     { bg: '#007AFF', shadow: '0 0 0 3px rgba(0,122,255,.2)' },
  booked:      { bg: '#5856D6' },
  in_progress: { bg: '#FF9500' },
  done:        { bg: '#34C759' },
  cancelled:   { bg: '#FF3B30' },
}

export function StatusDot({ status }: { status: EntryStatus }) {
  const c = colors[status]
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: c.bg, flexShrink: 0,
      boxShadow: c.shadow,
    }} />
  )
}
