import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const navItems = [
  {
    path: '/app', label: 'Записи',
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={active ? '#fff' : '#9A8060'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
  },
  {
    path: '/app/browse', label: 'Знайти',
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={active ? '#fff' : '#9A8060'} strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
    ),
  },
  {
    path: '/app/chat', label: 'Чат',
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={active ? '#fff' : '#9A8060'} strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    path: '/app/profile', label: 'Профіль',
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={active ? '#fff' : '#9A8060'} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const unread = useQuery(api.messages.unreadCount) ?? 0

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      height: '100dvh', position: 'sticky', top: 0,
      background: '#1A1612',
      display: 'flex', flexDirection: 'column',
      padding: '24px 12px',
      borderRight: '1px solid rgba(255,255,255,.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 8px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff', fontFamily: 'inherit' }}>
          O
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -.3 }}>OTaska</span>
      </div>

      {/* New button */}
      <button
        onClick={() => navigate('/app/new', { state: { backgroundLocation: location } })}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12, border: 'none',
          background: '#EF9F27', cursor: 'pointer',
          color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
          marginBottom: 20,
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Новий запис
      </button>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          const isChat = item.path === '/app/chat'
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: active ? 'rgba(255,255,255,.1)' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                color: active ? '#fff' : '#9A8060',
                fontSize: 14, fontWeight: active ? 700 : 500,
                textAlign: 'left', position: 'relative',
                transition: 'background .15s, color .15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {item.icon(active)}
              {item.label}
              {isChat && unread > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#EF9F27', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  borderRadius: 99, padding: '1px 7px', minWidth: 20, textAlign: 'center',
                }}>
                  {unread}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
