import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BellButton } from '../components/layout/NavBar'

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'щойно'
  if (min < 60) return `${min} хв`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} год`
  return `${Math.floor(h / 24)} дн`
}

export function Chat() {
  const navigate = useNavigate()
  const convs = useQuery(api.messages.listConversations) ?? null

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'var(--bg-page-blur)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--hairline)',
      }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', position: 'relative' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.4px' }}>Повідомлення</span>
          <div style={{ position: 'absolute', right: 12 }}><BellButton /></div>
        </div>
      </div>

      {convs === null ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : convs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Немає повідомлень</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Чат з'явиться після того, як ви напишете виконавцю або подасте пропозицію</div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {convs.map(conv => {
            const initials = conv.partnerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={conv.partnerId}
                onClick={() => navigate(`/app/chat/${conv.partnerId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', cursor: 'pointer',
                  background: '#fff', borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  boxShadow: conv.unread > 0 ? '0 2px 12px rgba(239,159,39,.15)' : '0 2px 8px rgba(0,0,0,.05)',
                  transition: 'transform .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, #5A3E22 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'var(--accent)',
                  }}>
                    {initials}
                  </div>
                  {conv.unread > 0 && (
                    <div style={{
                      position: 'absolute', top: -2, right: -2,
                      minWidth: 20, height: 20, borderRadius: 99,
                      background: 'var(--accent)', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff',
                      padding: '0 5px',
                    }}>
                      {conv.unread}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: conv.unread > 0 ? 700 : 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.partnerName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                      {timeAgo(conv.lastTime)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, lineHeight: 1.4,
                    color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: conv.unread > 0 ? 500 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.lastText}
                  </div>
                </div>

                {/* Chevron */}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
