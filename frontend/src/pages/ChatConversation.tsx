import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function ChatConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const partnerId = id as Id<'users'>
  const bottomRef = useRef<HTMLDivElement>(null)

  const me = useQuery(api.users.getMe)
  const partner = useQuery(api.users.getUser, partnerId ? { userId: partnerId } : 'skip')
  const messages = useQuery(api.messages.listWithUser, partnerId ? { partnerId } : 'skip') ?? []
  const sendMsg = useMutation(api.messages.send)
  const markRead = useMutation(api.messages.markRead)

  const prefill = (location.state as { prefill?: string } | null)?.prefill ?? ''
  const [input, setInput] = useState(prefill)
  const [sending, setSending] = useState(false)
  const [optimistic, setOptimistic] = useState<{ text: string; ts: number }[]>([])

  const myId = me?._id

  // Play sound on incoming messages
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevCountRef = useRef<number>(-1)
  useEffect(() => {
    audioRef.current = new Audio('/new-notification.mp3')
    audioRef.current.volume = 0.7
    audioRef.current.load()
  }, [])
  useEffect(() => {
    if (!myId) return
    const incomingCount = messages.filter(m => m.fromId !== myId).length
    if (prevCountRef.current === -1) {
      // first load — just store count, don't play
      prevCountRef.current = incomingCount
      return
    }
    if (incomingCount > prevCountRef.current) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    }
    prevCountRef.current = incomingCount
  }, [messages.length, myId])

  const allMessages = [
    ...messages,
    ...optimistic
      .filter(o => !messages.some(m => m.text === o.text && m._creationTime >= o.ts))
      .map(o => ({ _id: `opt-${o.ts}` as Id<'messages'>, text: o.text, fromId: myId!, toId: partnerId, _creationTime: o.ts, read: false, entryId: undefined, flaggedContact: false })),
  ].sort((a, b) => a._creationTime - b._creationTime)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  useEffect(() => {
    if (partnerId) markRead({ partnerId })
  }, [partnerId, messages.length])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    const ts = Date.now()
    setInput('')
    setOptimistic(prev => [...prev, { text, ts }])
    setSending(true)
    try {
      await sendMsg({ toId: partnerId, text })
    } finally {
      setSending(false)
      setOptimistic(prev => prev.filter(o => o.ts !== ts))
    }
  }

  const partnerName = partner?.name ?? partner?.email?.split('@')[0] ?? 'Користувач'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-page)', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid var(--hairline)', flexShrink: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--text-secondary)', fontSize: 15 }}>
            ← Назад
          </button>
          <div onClick={() => partner && navigate(`/app/users/${partnerId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--dark) 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {partnerName[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{partnerName}</div>
              {partner?.profile?.city && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {partner.profile.city}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {allMessages.map(m => {
          const isMe = m.fromId === myId
          return (
            <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'var(--text-primary)' : '#fff', color: isMe ? '#fff' : 'var(--text-primary)', fontSize: 15, lineHeight: 1.45, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                {m.text}
                <div style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,.5)' : 'var(--text-dim)', marginTop: 4, textAlign: 'right' }}>
                  {new Date(m._creationTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {m.flaggedContact && isMe && (
                <div style={{ maxWidth: '78%', fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, padding: '0 4px' }}>
                  ⚠️ Схоже на контакт чи посилання. Угоди поза платформою не покриваються гарантією й захистом оплати.
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '0.5px solid var(--hairline)', padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Повідомлення..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 22, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: 'var(--bg-page)' }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? 'var(--text-primary)' : 'var(--border)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={input.trim() ? '#fff' : 'var(--text-dim)'} strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
