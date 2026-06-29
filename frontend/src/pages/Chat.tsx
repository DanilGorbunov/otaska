import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { MOCK_CONVERSATIONS } from '../lib/mockData'

export function Chat() {
  const navigate = useNavigate()

  return (
    <div>
      <NavBar title="Повідомлення" showBack={false} />

      {MOCK_CONVERSATIONS.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px', color: '#8E8E93' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#000', marginBottom: 8 }}>Немає повідомлень</div>
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>Чат з'явиться після того, як ви напишете виконавцю або подасте пропозицію</div>
        </div>
      ) : (
        <div style={{ background: '#fff', margin: '16px 16px 0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
          {MOCK_CONVERSATIONS.map((conv, i) => (
            <div key={conv.id}
              onClick={() => navigate(`/app/chat/${conv.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', cursor: 'pointer',
                borderBottom: i < MOCK_CONVERSATIONS.length - 1 ? '0.5px solid #F2F2F7' : 'none',
                background: '#fff',
                transition: 'background .1s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#F9F9F9')}
              onMouseOut={e => (e.currentTarget.style.background = '#fff')}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#111 0%,#444 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                }}>
                  {conv.initials}
                </div>
                {conv.unread > 0 && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#007AFF', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                  }}>
                    {conv.unread}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <div style={{ fontSize: 16, fontWeight: conv.unread > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8E8E93', flexShrink: 0, marginLeft: 8 }}>{conv.lastTime}</div>
                </div>
                <div style={{
                  fontSize: 14, color: conv.unread > 0 ? '#000' : '#8E8E93',
                  fontWeight: conv.unread > 0 ? 500 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {conv.lastMsg}
                </div>
              </div>

              {/* Chevron */}
              <svg width="7" height="13" viewBox="0 0 7 13" fill="none" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M1 1.5l5 5-5 5" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
