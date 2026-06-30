import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

type Step = 1 | 2

interface ChatMsg { role: 'user' | 'assistant'; content: string; card?: AIResult; cardIndex?: number }
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
  const [regMode, setRegMode]   = useState(false)
  const [regStep, setRegStep]   = useState(0) // 0=name, 1=email, 2=password
  const [error, setError]       = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)
  const chatBottomRef           = useRef<HTMLDivElement>(null)

  // Chat state
  const [msgs, setMsgs]         = useState<ChatMsg[]>([])
  const [chips, setChips]       = useState<string[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [aiResult, setAiResult]           = useState<AIResult | null>(null)
  const [secondAiResult, setSecondAiResult] = useState<AIResult | null>(null)
  const [askGoalStep, setAskGoalStep]     = useState(false)
  const [secondGoalMode, setSecondGoalMode] = useState(false)

  const REG_QUESTIONS = [
    { key: 'name',     question: 'Як тебе звати?',                      type: 'text',     placeholder: "Ім'я" },
    { key: 'email',    question: 'Твій email?',                         type: 'email',    placeholder: 'your@email.com' },
    { key: 'password', question: 'Придумай пароль (мін. 8 символів)',   type: 'password', placeholder: '••••••••' },
  ]

  const startRegFields = () => {
    setRegMode(true)
    setRegStep(0)
    setForm({ name: '', email: '', password: '', city: '' })
    setMsgs(prev => [...prev, { role: 'assistant', content: REG_QUESTIONS[0].question }])
    setChips([])
  }

  const sendToAI = async (messages: ChatMsg[]) => {
    setChatLoading(true)
    try {
      // filter out card-only messages (empty content) before sending to AI
      const apiMessages = messages.filter(m => m.content.trim() !== '')
      const raw = await callAI({ messages: apiMessages })
      const parsed = JSON.parse(raw as string)
      const assistantMsg: ChatMsg = { role: 'assistant', content: parsed.message }
      setMsgs(prev => [...prev, assistantMsg])
      if (parsed.type === 'question') {
        setChips(parsed.chips ?? [])
      } else if (parsed.type === 'result' && parsed.summary) {
        setChips([])
        if (secondGoalMode) {
          setSecondAiResult(parsed.summary)
          setSecondGoalMode(false)
          setMsgs(prev => [...prev, { role: 'assistant', content: '', card: parsed.summary, cardIndex: 1 }])
          setTimeout(() => startRegFields(), 600)
        } else {
          setAiResult(parsed.summary)
          setMsgs(prev => [...prev, { role: 'assistant', content: '', card: parsed.summary, cardIndex: 0 }])
          setTimeout(() => {
            setAskGoalStep(true)
            setChips(['Так, додам ще одну', 'Ні, все готово'])
            setMsgs(prev => [...prev, { role: 'assistant', content: 'Хочеш додати ще одну ціль?' }])
          }, 600)
        }
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Щось пішло не так. Спробуй ще раз.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const goStep2 = () => {
    if (task.trim().length < 5) return
    // reset all flow state
    setMsgs([])
    setChips([])
    setAiResult(null)
    setSecondAiResult(null)
    setAskGoalStep(false)
    setSecondGoalMode(false)
    setRegMode(false)
    setRegStep(0)
    setError('')
    setForm({ name: '', email: '', password: '', city: '' })
    setStep(2)
    const initialMsgs: ChatMsg[] = [{ role: 'user', content: task }]
    setMsgs(initialMsgs)
    sendToAI(initialMsgs)
  }

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return
    setMsgs(prev => [...prev, { role: 'user', content: text }])
    setChips([])
    setChatInput('')

    if (askGoalStep) {
      setAskGoalStep(false)
      const yes = text.toLowerCase().includes('так') || text.toLowerCase().includes('додам')
      if (yes) {
        setSecondGoalMode(true)
        setTimeout(() => setMsgs(prev => [...prev, { role: 'assistant', content: 'Опиши другу ціль' }]), 300)
      } else {
        setTimeout(() => startRegFields(), 300)
      }
      return
    }

    // for second goal: start a fresh AI context so it doesn't inherit first goal's details
    const newMsgs: ChatMsg[] = secondGoalMode
      ? [{ role: 'user', content: text }]
      : [...msgs.filter(m => m.content.trim() !== ''), { role: 'user', content: text }]
    await sendToAI(newMsgs)
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const handleRegInput = async () => {
    const field = REG_QUESTIONS[regStep]
    const val = chatInput.trim()
    if (!val) return
    if (field.key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError('Невірний email'); return
    }
    if (field.key === 'password' && val.length < 8) {
      setError('Мінімум 8 символів'); return
    }
    setError('')
    const displayVal = field.key === 'password' ? '••••••••' : val
    setMsgs(prev => [...prev, { role: 'user', content: displayVal }])
    setForm(prev => ({ ...prev, [field.key]: val }))
    setChatInput('')

    const updatedForm = { ...form, [field.key]: val }

    if (regStep < REG_QUESTIONS.length - 1) {
      const next = REG_QUESTIONS[regStep + 1]
      setTimeout(() => {
        setMsgs(prev => [...prev, { role: 'assistant', content: next.question }])
        setRegStep(s => s + 1)
      }, 300)
    } else {
      // all fields collected → register
      setTimeout(async () => {
        const goalCount = secondAiResult ? 2 : 1
        setMsgs(prev => [...prev, { role: 'assistant', content: `Публікуємо ${goalCount === 2 ? 'твої цілі' : 'твій запис'}…` }])
        setAuthLoading(true)
        try {
          await signIn('password', { email: updatedForm.email, password: updatedForm.password, name: updatedForm.name, flow: 'signUp' })
          const city = updatedForm.city || 'Bratislava'

          const publishGoal = async (r: AIResult | null, description: string) => {
            if (!r) return null
            return createAndPublish({
              title: r.title ?? description.slice(0, 200),
              description,
              intentType: r.intentType as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job',
              entryType: r.entryType as 'on_demand' | 'project' | 'material',
              category: r.category,
              city,
              budgetMin: r.budgetMin,
              budgetMax: r.budgetMax,
            }).catch(() => null)
          }

          const [id1, id2] = await Promise.all([
            publishGoal(aiResult, task),
            secondAiResult ? publishGoal(secondAiResult, msgs.find(m => m.card?.cardIndex === 1)?.card?.title ?? '') : Promise.resolve(null),
          ])

          const goals = [
            aiResult ? { id: id1 as string | null, aiResult: { emoji: aiResult.emoji, category: aiResult.category, title: aiResult.title, min: aiResult.budgetMin, max: aiResult.budgetMax, time: aiResult.details }, task } : null,
            secondAiResult ? { id: id2 as string | null, aiResult: { emoji: secondAiResult.emoji, category: secondAiResult.category, title: secondAiResult.title, min: secondAiResult.budgetMin, max: secondAiResult.budgetMax, time: secondAiResult.details }, task: secondAiResult.title } : null,
          ].filter(Boolean)

          navigate('/app', { state: { newRegistration: { goals, city, name: updatedForm.name } } })
        } catch (err: unknown) {
          const msg = (err as Error)?.message ?? ''
          setMsgs(prev => [...prev, { role: 'assistant', content: msg.includes('already') ? 'Цей email вже зареєстровано. Спробуй увійти.' : 'Помилка реєстрації. Спробуй ще раз.' }])
          setRegMode(false)
        } finally {
          setAuthLoading(false)
        }
      }, 300)
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
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 57px)', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 0' }}>
            <button onClick={() => setStep(1)} style={S.back}><BackArrow /> Назад</button>

            {msgs.map((m, i) => m.card ? (
              <div key={i} style={{ background: '#fff', border: '2px solid #EF9F27', borderRadius: 16, padding: '12px 16px', marginBottom: 10, boxShadow: '0 4px 20px rgba(239,159,39,.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#B4924A', textTransform: 'uppercase', marginBottom: 6 }}>
                  Ціль{secondAiResult ? ` ${(m.cardIndex ?? 0) + 1}` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.card.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1612' }}>{m.card.title}</div>
                    <div style={{ fontSize: 12, color: '#9A8060' }}>{m.card.details}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#EF9F27', whiteSpace: 'nowrap' }}>€{m.card.budgetMin}–{m.card.budgetMax}</div>
                </div>
              </div>
            ) : (
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

            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          {(!aiResult || regMode || askGoalStep || secondGoalMode) && (
            <div style={{ padding: '12px 16px 20px', background: '#F5F4F1', borderTop: '1px solid #EDE8DF' }}>
              {!regMode && chips.length > 0 && (
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
              {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 8 }}>{error}</p>}
              <form onSubmit={e => { e.preventDefault(); regMode ? handleRegInput() : sendUserMessage(chatInput) }} style={{ display: 'flex', gap: 8 }}>
                <input
                  key={regMode ? `reg-${regStep}` : 'chat'}
                  type={regMode ? REG_QUESTIONS[regStep]?.type : 'text'}
                  value={chatInput}
                  onChange={e => { setChatInput(e.target.value); setError('') }}
                  placeholder={regMode ? REG_QUESTIONS[regStep]?.placeholder : 'або напиши свою відповідь...'}
                  autoFocus={regMode}
                  autoComplete={regMode && REG_QUESTIONS[regStep]?.key === 'password' ? 'new-password' : regMode && REG_QUESTIONS[regStep]?.key === 'email' ? 'email' : 'off'}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading || authLoading}
                  style={{ padding: '12px 16px', borderRadius: 12, background: '#1A1612', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, opacity: !chatInput.trim() || chatLoading || authLoading ? 0.4 : 1 }}
                >↑</button>
              </form>
            </div>
          )}
        </div>
      )}



      <style>{`
        @keyframes hexPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes dotA { 0%,80%,100%{opacity:.25;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}
