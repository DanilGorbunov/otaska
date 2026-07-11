import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

interface NavBarProps {
  title: string
  backTitle?: string
  showBack?: boolean
  showBell?: boolean
  right?: React.ReactNode
}

export function BellButton() {
  const navigate = useNavigate()
  const unread = useQuery(api.messages.unreadCount, {}) ?? 0
  return (
    <button onClick={() => navigate('/app/chat')} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', WebkitTapHighlightColor: 'transparent',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <div style={{
          position: 'absolute', top: 1, right: 1,
          width: 14, height: 14, borderRadius: '50%',
          background: '#FF3B30', border: '1.5px solid rgba(242,242,247,.94)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: '#fff',
        }}>{unread}</div>
      )}
    </button>
  )
}

function ChevronLeft() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
      <path d="M10 2L2 10L10 18" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NavBar({ title, backTitle = 'Назад', showBack = true, showBell = false, right }: NavBarProps) {
  const navigate = useNavigate()
  const rightContent = right ?? (showBell ? <BellButton /> : null)

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 60,
      background: 'rgba(242,242,247,.94)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid rgba(60,60,67,.18)',
      height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 8px',
    }}>
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', left: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 3,
            color: '#007AFF', fontSize: 17, padding: '0 8px', height: 44,
            fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronLeft />
          <span style={{ fontSize: 17, fontWeight: 400 }}>{backTitle}</span>
        </button>
      )}

      <span style={{ fontSize: 17, fontWeight: 600, color: '#000', letterSpacing: '-.3px' }}>
        {title}
      </span>

      {rightContent && (
        <div style={{ position: 'absolute', right: 12 }}>
          {rightContent}
        </div>
      )}
    </div>
  )
}
