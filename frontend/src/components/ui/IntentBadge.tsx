import type { IntentType } from '../../types'

const config: Record<IntentType, { label: string; bg: string; color: string }> = {
  seeking_service:  { label: 'шукаю виконавця',  bg: 'rgba(0,0,0,.05)',  color: '#333333' },
  offering_service: { label: 'пропоную послугу', bg: 'rgba(0,122,255,.1)',   color: '#0A7AFF' },
  seeking_material: { label: 'шукаю матеріали',  bg: 'rgba(52,199,89,.1)',   color: '#248A3D' },
  seeking_job:      { label: 'шукаю роботу',     bg: 'rgba(88,86,214,.1)',   color: '#5856D6' },
}

export function IntentBadge({ type }: { type: IntentType }) {
  const c = config[type]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
      background: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  )
}
