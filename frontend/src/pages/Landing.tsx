import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

type Step = 1 | 2 | 3

interface ChatMsg { role: 'user' | 'assistant'; content: string }
interface AIResult {
  emoji: string; category: string; title: string; details: string
  budgetMin: number; budgetMax: number
  intentType: string; entryType: string
}

const TAGS = [
  { label: '🔧 Шукаю майстра',    fill: 'Шукаю майстра для ремонту в квартирі' },
  { label: '🪨 Шукаю матеріали',  fill: 'Потрібен щебінь 40т для будівництва' },
  { label: '💼 Пропоную послугу', fill: 'Роблю електрику — доступний з понеділка' },
  { label: '👷 Шукаю роботу',     fill: 'Шукаю роботу будівельника, досвід 5 років' },
]

const STEP_NAMES = ['ПИШУ', 'AI', 'РЕЄСТРАЦІЯ']

// ─── Component ───────────────────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const callAI = useAction(api.ai.chat)

  const [step, setStep]         = useState<Step>(1)
  const [task, setTask]         = useState('')
  const [focused, setFocused]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '', city: '' })
  const [error, setError]       = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)
  const chatBottomRef           = useRef<HTMLDivElement>(null)

  // Chat state
  const [msgs, setMsgs]         = useState<ChatMsg[]>([])
  const [chips, setChips]       = useState<string[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)

  const sendToAI = async (messages: ChatMsg[]) => {
    setChatLoading(true)
    try {
      const raw = await callAI({ messages })
      const parsed = JSON.parse(raw as string)
      const assistantMsg: ChatMsg = { role: 'assistant', content: parsed.message }
      setMsgs(prev => [...prev, assistantMsg])
      if (parsed.type === 'question') {
        setChips(parsed.chips ?? [])
      } else if (parsed.type === 'result' && parsed.summary) {
        setChips([])
        setAiResult(parsed.summary)
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Щось пішло не так. Спробуй ще раз.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const goStep2 = () => {
    if (task.trim().length < 5) return
    const initialMsgs: ChatMsg[] = [{ role: 'user', content: task }]
    setMsgs(initialMsgs)
    setChips([])
    setAiResult(null)
    setStep(2)
    sendToAI(initialMsgs)
  }

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return
    const newMsgs: ChatMsg[] = [...msgs, { role: 'user', content: text }]
    setMsgs(newMsgs)
    setChips([])
    setChatInput('')
    await sendToAI(newMsgs)
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Заповни ім'я, email і пароль")
      return
    }
    setError('')
    setAuthLoading(true)
    try {
      await signIn('password', { email: form.email, password: form.password, name: form.name, flow: 'signUp' })
      let newEntryId: string | null = null
      if (task.trim()) {
        const id = await createAndPublish({
          title: aiResult?.title ?? task.slice(0, 200),
          description: task,
          intentType: (aiResult?.intentType ?? 'seeking_service') as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job',
          entryType: (aiResult?.entryType ?? 'on_demand') as 'on_demand' | 'project' | 'material',
          category: aiResult?.category,
          city: form.city || 'Bratislava',
          budgetMin: aiResult?.budgetMin,
          budgetMax: aiResult?.budgetMax,
        }).catch(() => null)
        newEntryId = id ?? null
      }
      navigate('/app', { state: { newEntry: newEntryId ? { id: newEntryId, task, aiResult: aiResult ? { emoji: aiResult.emoji, category: aiResult.category, min: aiResult.budgetMin, max: aiResult.budgetMax, time: aiResult.details } : null, city: form.city } : null } })
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? ''
      setError(msg.includes('already') ? 'Цей email вже зареєстровано' : 'Помилка реєстрації')
    } finally {
      setAuthLoading(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page:     { minHeight: '100dvh', background: '#F5F4F1', color: '#1A1612', fontFamily: "system-ui,-apple-system,sans-serif" } as const,
    nav:      { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,244,241,.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8DF' } as const,
    navInner: { maxWidth: 640, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
    wrap:     { maxWidth: 640, margin: '0 auto', padding: '0 20px' } as const,
    card:     { background: '#fff', border: '1.5px solid #EDE8DF', borderRadius: 16, padding: 28 } as const,
    inputEl:  { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 16, color: '#1A1612', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' } as const,
    btnAmber: { width: '100%', padding: 16, borderRadius: 12, background: '#EF9F27', color: '#1A1612', fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' } as const,
    btnGhost: { flex: 1, padding: 15, borderRadius: 12, background: 'transparent', color: '#5A4A2E', fontFamily: 'system-ui', fontSize: 16, fontWeight: 500, border: '1.5px solid #EDE8DF', cursor: 'pointer' } as const,
    back:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#9A8060', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', marginBottom: 32, padding: 0 } as const,
  }

  const Dots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: i === step ? 20 : 8, height: 8, borderRadius: 99,
          background: i === step ? '#EF9F27' : i < step ? '#EF9F27' : '#EDE8DF',
          opacity: i < step ? 0.5 : 1, transition: 'all .3s',
        }} />
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9A8060', marginLeft: 6, letterSpacing: '.3px', textTransform: 'uppercase' }}>
        {STEP_NAMES[step - 1]}
      </span>
    </div>
  )

  const Hex = ({ size = 64 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,1.5 28.5,8.75 28.5,23.25 16,30.5 3.5,23.25 3.5,8.75" fill="#EF9F27" stroke="#BA7517" strokeWidth="1" />
      <polyline points="9,16.5 13.5,21.5 23,10.5" stroke="#1A1612" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const QuestionMark = () => (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M11 10C11 7.2 13.2 5 16 5C18.8 5 21 7.2 21 10C21 12.8 18.8 14 16 14V17" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2" fill="#EF9F27" />
    </svg>
  )

  const BackArrow = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Hex size={28} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.3px' }}>
              <span style={{ color: '#EF9F27', fontWeight: 800 }}>O</span>
              <span style={{ color: '#1A1612' }}>Taska</span>
            </span>
          </a>
          <Dots />
          <button onClick={() => navigate('/login')} style={{ fontSize: 14, fontWeight: 500, color: '#9A8060', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui' }}>
            Увійти
          </button>
        </div>
      </nav>

      {/* ═══ STEP 1: WRITE ═══ */}
      {step === 1 && (
        <div style={{ ...S.wrap, padding: '60px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
<h1 style={{ fontSize: 'clamp(40px,7vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: '#1A1612', marginBottom: 14 }}>
            Просто напиши<br /><span style={{ color: '#EF9F27' }}>задачу.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#9A8060', lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
            Потрібно щось зробити? Шукаєш роботу?<br />Напиши як нотатку — ми зробимо решту.
          </p>

          <div style={{ width: '100%', marginBottom: 16 }}>
            <div style={{
              background: '#fff',
              border: `1.5px solid ${focused || task ? '#EF9F27' : '#EDE8DF'}`,
              borderRadius: 16, padding: 20,
              boxShadow: focused ? '0 0 0 4px rgba(239,159,39,.12)' : '0 2px 12px rgba(0,0,0,.04)',
              transition: 'border-color .2s, box-shadow .2s',
            }}>
              <textarea
                ref={textareaRef}
                value={task}
                onChange={e => { setTask(e.target.value); setAiResult(null) }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="сантехнік, доступний пн–пт..."
                rows={4}
                style={{ width: '100%', fontSize: 18, color: '#1A1612', border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.55, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #EDE8DF' }}>
                {/* Live AI status while typing */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  {task.length >= 6 && aiResult ? (
                    <span style={{ color: '#EF9F27', fontWeight: 600 }}>
                      {aiResult.emoji} {aiResult.category === 'Послуга' ? 'Розпізнано' : aiResult.category}
                    </span>
                  ) : (
                    <>
                      {['0s', '.2s', '.4s'].map((d, i) => (
                        <span key={i} style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#EF9F27', animation: `dotA 1.3s ease-in-out ${d} infinite` }} />
                      ))}
                      <span style={{ color: '#B4A898', marginLeft: 2 }}>AI розпізнає намір</span>
                    </>
                  )}
                </div>
                <button
                  onClick={goStep2}
                  disabled={task.trim().length < 5}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    cursor: task.trim().length >= 5 ? 'pointer' : 'not-allowed',
                    background: task.trim().length >= 5 ? '#1A1612' : '#EDE8DF',
                    color: task.trim().length >= 5 ? '#fff' : '#B4A898',
                    fontFamily: 'system-ui', fontSize: 15, fontWeight: 600, transition: 'all .18s',
                  }}
                >
                  Далі →
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TAGS.map(t => (
              <button key={t.label}
                onClick={() => { setTask(t.fill); setAiResult(null); textareaRef.current?.focus() }}
                style={{ padding: '8px 16px', borderRadius: 20, background: '#fff', border: '1px solid #EDE8DF', fontSize: 14, color: '#5A4A2E', cursor: 'pointer', fontWeight: 500, fontFamily: 'system-ui' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#EF9F27'; e.currentTarget.style.color = '#EF9F27' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.color = '#5A4A2E' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STEP 2: AI CHAT ═══ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 57px)' }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 0' }}>
            <button onClick={() => setStep(1)} style={S.back}><BackArrow /> Назад</button>

            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 14 }}>✦</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? '#1A1612' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1A1612',
                  fontSize: 15, lineHeight: 1.5,
                  border: m.role === 'assistant' ? '1.5px solid #EDE8DF' : 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>✦</span>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#fff', border: '1.5px solid #EDE8DF', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF9F27', display: 'inline-block', animation: `dotA 1.3s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Result card */}
            {aiResult && (
              <div style={{ background: '#fff', border: '2px solid #EF9F27', borderRadius: 16, padding: '18px 20px', marginBottom: 12, boxShadow: '0 4px 20px rgba(239,159,39,.12)' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{aiResult.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1612', marginBottom: 4 }}>{aiResult.title}</div>
                <div style={{ fontSize: 14, color: '#9A8060', marginBottom: 12 }}>{aiResult.details}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#EF9F27' }}>€{aiResult.budgetMin} — €{aiResult.budgetMax}</div>
                <button onClick={() => setStep(3)} style={{ ...S.btnAmber, marginTop: 16 }}>
                  Далі — реєстрація →
                </button>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chips + input */}
          {!aiResult && (
            <div style={{ padding: '12px 16px 20px', background: '#F5F4F1', borderTop: '1px solid #EDE8DF' }}>
              {chips.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                  {chips.map(c => (
                    <button key={c} onClick={() => sendUserMessage(c)}
                      style={{ padding: '8px 16px', borderRadius: 20, background: '#fff', border: '1.5px solid #EDE8DF', fontSize: 14, color: '#1A1612', cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 500 }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#EF9F27'; e.currentTarget.style.color = '#EF9F27' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.color = '#1A1612' }}
                    >{c}</button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendUserMessage(chatInput)}
                  placeholder="або напиши свою відповідь..."
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
                />
                <button
                  onClick={() => sendUserMessage(chatInput)}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{ padding: '12px 16px', borderRadius: 12, background: '#1A1612', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, opacity: !chatInput.trim() || chatLoading ? 0.4 : 1 }}
                >↑</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 3: REGISTER ═══ */}
      {step === 3 && (
        <div style={{ ...S.wrap, padding: '40px 20px 80px' }}>
          <button onClick={() => setStep(2)} style={S.back}><BackArrow /> Назад</button>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1A1612', letterSpacing: -1, marginBottom: 8 }}>Майже готово</h2>
          <p style={{ fontSize: 15, color: '#9A8060', marginBottom: 32 }}>Ще один крок — і твій запис буде опублікований</p>

          <form onSubmit={e => { e.preventDefault(); handleRegister() }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {aiResult && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF6E8', border: '1px solid #F5D99A', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{aiResult.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8A6020' }}>
                  {aiResult.category} · €{aiResult.budgetMin}–{aiResult.budgetMax}
                </span>
              </div>
            )}

            {[
              { key: 'name',     label: "Ім'я",   type: 'text',     placeholder: "Ваше ім'я" },
              { key: 'email',    label: 'Email',  type: 'email',    placeholder: 'your@email.com' },
              { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••• (мін. 8 символів)' },
              { key: 'city',     label: 'Місто',  type: 'text',     placeholder: 'Bratislava' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9A8060', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete={f.type === 'password' ? 'new-password' : f.type === 'email' ? 'email' : f.key === 'name' ? 'name' : undefined}
                  style={S.inputEl}
                  onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(239,159,39,.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: 14, color: '#DC2626' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={authLoading}
              style={{ ...S.btnAmber, opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? 'Публікуємо...' : 'Опублікувати запис →'}
            </button>

            <p style={{ fontSize: 12, color: '#B4A898', textAlign: 'center' }}>
              Реєструючись ти погоджуєшся з <a href="#" style={{ color: '#EF9F27', fontWeight: 500 }}>умовами використання</a>
            </p>
            <p style={{ fontSize: 14, color: '#9A8060', textAlign: 'center' }}>
              Вже є акаунт?{' '}
              <button type="button" onClick={() => navigate('/login')} style={{ color: '#EF9F27', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 14 }}>
                Увійти
              </button>
            </p>
          </form>
        </div>
      )}


      <style>{`
        @keyframes hexPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes dotA { 0%,80%,100%{opacity:.25;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}
