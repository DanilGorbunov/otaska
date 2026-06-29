import { useNavigate } from 'react-router-dom'
import type { Entry } from '../../types'
import { StatusDot } from '../ui/StatusDot'
import { IntentBadge } from '../ui/IntentBadge'

const statusLabel: Record<string, string> = {
  draft: 'Чернетка', open: 'Відкрито', matched: 'Знайдено',
  booked: 'Заброньовано', in_progress: 'Виконується', done: 'Виконано ✓', cancelled: 'Скасовано',
}

interface Props {
  entry: Entry
  showIntent?: boolean
}

export function EntryCard({ entry, showIntent = false }: Props) {
  const navigate = useNavigate()

  const right = entry.proposal_count > 0
    ? `${entry.proposal_count} ${entry.proposal_count === 1 ? 'офер' : 'офери'}`
    : statusLabel[entry.status] ?? entry.status

  return (
    <div
      onClick={() => navigate(`/app/entries/${entry.id}`)}
      style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '0.5px solid #E5E5EA', cursor: 'pointer',
        transition: 'background .1s',
      }}
      onMouseOver={e => (e.currentTarget.style.background = '#F9F9F9')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      <StatusDot status={entry.status} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.title}
        </div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {showIntent && <IntentBadge type={entry.intent_type} />}
          {entry.category && <span>{entry.category}</span>}
          {(entry.budget_min || entry.budget_max) && (
            <span>€{entry.budget_min ?? '?'}–{entry.budget_max ?? '?'}</span>
          )}
          {entry.city && <span>📍 {entry.city}</span>}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#333333', flexShrink: 0, marginLeft: 8 }}>
        {right}
      </div>
      <svg width="7" height="13" viewBox="0 0 7 13" fill="none" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 4 }}>
        <path d="M1 1.5l5 5-5 5" />
      </svg>
    </div>
  )
}
