import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function ChatConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const partnerId = id as Id<'users'>
  const bottomRef = useRef<HTMLDivElement>(null)

  const me = useQuery(api.users.getMe)
  const partner = useQuery(api.users.getUser, partnerId ? { userId: partnerId } : 'skip')
  const messages = useQuery(api.messages.listWithUser, partnerId ? { partnerId } : 'skip') ?? []
  const sendMsg = useMutation(api.messages.send)
  const markRead = useMutation(api.messages.markRead)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (partnerId) markRead({ partnerId })
  }, [partnerId, messages.length])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMsg({ toId: partnerId, text })
    } finally {
      setSending(false)
    }
  }

  const partnerName = partner?.name ?? partner?.email?.split('@')[0] ?? 'Користувач'
  const myId = me?._id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#F5F4F1' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(60,60,67,.18)', flexShrink: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#9A8060', fontSize: 15 }}>
            ← Назад
          </button>
          <div onClick={() => partner && navigate(`/app/users/${partnerId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#111 0%,#444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {partnerName[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1612' }}>{partnerName}</div>
              {partner?.profile?.city && <div style={{ fontSize: 12, color: '#9A8060' }}>📍 {partner.profile.city}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {messages.map(m => {
          const isMe = m.fromId === myId
          return (
            <div key={m._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? '#1A1612' : '#fff', color: isMe ? '#fff' : '#1A1612', fontSize: 15, lineHeight: 1.45, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                {m.text}
                <div style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,.5)' : '#C0B49A', marginTop: 4, textAlign: 'right' }}>
                  {new Date(m._creationTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '0.5px solid rgba(60,60,67,.18)', padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Повідомлення..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 22, border: '1.5px solid #EDE8DF', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#F5F4F1' }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? '#1A1612' : '#EDE8DF', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={input.trim() ? '#fff' : '#C0B49A'} strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
