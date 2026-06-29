import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { MOCK_CONVERSATIONS, MOCK_PROVIDERS, type MockMessage } from '../lib/mockData'

export function ChatConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Support opening from provider profile: id could be 'pr1' etc. or 'c1'
  const conv = MOCK_CONVERSATIONS.find(c => c.id === id || c.providerId === id)
  const provider = conv ? MOCK_PROVIDERS[conv.providerId] : undefined

  const [messages, setMessages] = useState<MockMessage[]>(conv?.messages ?? [])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setSending(true)
    setInput('')
    const newMsg: MockMessage = { id: `m${Date.now()}`, from: 'me', text, time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, newMsg])
    setSending(false)

    // Mock reply after 1.2s
    setTimeout(() => {
      const replies = [
        'Зрозуміло, дякую за інформацію!',
        'Добре, я вас почув. Можемо домовитись.',
        'Окей, уточню ще кілька деталей.',
        'Гарно. Надішлю вам деталі трохи пізніше.',
        'Так, це реально. Давайте обговоримо ціну.',
      ]
      const reply: MockMessage = {
        id: `m${Date.now() + 1}`,
        from: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, reply])
    }, 1200)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!conv) return (
    <div>
      <NavBar title="Чат" />
      <div style={{ textAlign: 'center', padding: 64, color: '#8E8E93' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Розмову не знайдено</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header — clickable avatar area goes to provider profile */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
        height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 0,
      }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 3,
          color: '#007AFF', fontSize: 17, padding: '0 8px', height: 56, fontFamily: 'inherit',
        }}>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round">
            <path d="M8 1L1 8l7 7" />
          </svg>
          <span style={{ fontWeight: 400 }}>Назад</span>
        </button>

        {/* Center: avatar + name */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate(`/app/users/${conv.providerId}`)}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 1,
          }}>{conv.initials}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#000', letterSpacing: '-.2px' }}>{conv.name}</div>
        </div>

        {/* Right: info button */}
        <button onClick={() => navigate(`/app/users/${conv.providerId}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 12px', color: '#007AFF', height: 56,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Date header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#8E8E93', background: 'rgba(118,118,128,.12)', padding: '3px 10px', borderRadius: 20 }}>
            Сьогодні
          </span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start',
          }}>
            {msg.from === 'them' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                marginRight: 8, alignSelf: 'flex-end',
              }}>
                {conv.initials.slice(0, 2)}
              </div>
            )}
            <div style={{ maxWidth: '72%' }}>
              <div style={{
                padding: '10px 14px', borderRadius: msg.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.from === 'me' ? '#007AFF' : '#fff',
                color: msg.from === 'me' ? '#fff' : '#000',
                fontSize: 15, lineHeight: 1.45,
                boxShadow: msg.from === 'me' ? 'none' : '0 1px 4px rgba(0,0,0,.1)',
              }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: 11, color: '#8E8E93', marginTop: 3,
                textAlign: msg.from === 'me' ? 'right' : 'left', paddingRight: 2,
              }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px 24px', background: 'rgba(242,242,247,.96)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(60,60,67,.18)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <div style={{
          flex: 1, background: '#fff', borderRadius: 20, border: '1px solid #E5E5EA',
          padding: '9px 14px', minHeight: 38, display: 'flex', alignItems: 'center',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Повідомлення..."
            rows={1}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 16, fontFamily: 'inherit', background: 'transparent',
              lineHeight: 1.4, maxHeight: 100, overflowY: 'auto',
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: input.trim() ? '#007AFF' : '#C7C7CC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background .15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
