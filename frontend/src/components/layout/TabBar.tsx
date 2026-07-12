import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useEffect, useRef } from 'react'

const tabs = [
  {
    path: '/app', label: 'Записи',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? '#000' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
  },
  {
    path: '/app/browse', label: 'Знайти',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? '#000' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
    ),
  },
  { path: '/app/new', label: '', icon: () => null }, // FAB placeholder
  {
    path: '/app/chat', label: 'Чат',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? '#000' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    path: '/app/profile', label: 'Профіль',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? '#000' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

// Reuse one AudioContext instead of creating a fresh one per call — a fresh
// context can only start inside a user-gesture handler, and playPop() is
// triggered by realtime Convex updates, not clicks, so it would otherwise
// always log Chrome's autoplay-blocked warning.
let sharedAudioCtx: AudioContext | null = null

if (typeof window !== 'undefined') {
  const resumeOnGesture = () => {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    sharedAudioCtx.resume().catch(() => {})
    window.removeEventListener('pointerdown', resumeOnGesture)
    window.removeEventListener('keydown', resumeOnGesture)
  }
  window.addEventListener('pointerdown', resumeOnGesture)
  window.addEventListener('keydown', resumeOnGesture)
}

function playPop() {
  const ctx = sharedAudioCtx
  if (!ctx || ctx.state !== 'running') return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.18)
  } catch { /* ignore */ }
}

export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const unread = useQuery(api.messages.unreadCount) ?? 0
  const prevUnread = useRef(unread)
  const matchCount = useQuery(api.entries.myMatchCount) ?? 0
  const prevMatchCount = useRef(matchCount)

  useEffect(() => {
    if (unread > prevUnread.current && !location.pathname.startsWith('/app/chat/')) {
      playPop()
    }
    prevUnread.current = unread
  }, [unread, location.pathname])

  useEffect(() => {
    if (matchCount > prevMatchCount.current && location.pathname !== '/app') {
      playPop()
    }
    prevMatchCount.current = matchCount
  }, [matchCount, location.pathname])

  const openNew = () => {
    navigate('/app/new', { state: { backgroundLocation: location } })
  }

  return (
    <div className="tabbar" style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 50,
      background: 'rgba(249,249,249,.94)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(60,60,67,.18)',
      height: 60, display: 'flex', alignItems: 'center', padding: '0 4px 4px',
    }}>
      {tabs.map((tab, i) => {
        if (i === 2) {
          return (
            <div key="fab" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: -14 }}
              onClick={openNew}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: '#111111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,.25)',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>
          )
        }
        const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
        const isChat = tab.path === '/app/chat'
        const isEntries = tab.path === '/app'
        return (
          <div key={tab.path} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', paddingTop: 6, position: 'relative' }}
            onClick={() => navigate(tab.path)}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {tab.icon(active)}
              {((isChat && unread > 0) || (isEntries && matchCount > 0)) && !active && (
                <div style={{
                  position: 'absolute', top: 0, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#EF9F27',
                  border: '1.5px solid rgba(249,249,249,.94)',
                }} />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#000' : '#8E8E93' }}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}
