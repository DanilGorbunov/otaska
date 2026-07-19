import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { CATEGORIES } from '../lib/categories'
import { Logo } from '../components/layout/Logo'

type Step = 1 | 2

interface ChatMsg { role: 'user' | 'assistant'; content: string; card?: AIResult; cardIndex?: number; kind?: 'reg' }
interface AIResult {
  emoji: string; category: string; title: string; details: string
  budgetMin: number; budgetMax: number
  intentType: string; entryType: string
  city?: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { signIn } = useAuthActions()
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const callAI = useAction(api.ai.chat)

  const TAGS = [
    { label: t('landing.tags.master.label'), fill: t('landing.tags.master.fill') },
    { label: t('landing.tags.materials.label'), fill: t('landing.tags.materials.fill') },
    { label: t('landing.tags.service.label'), fill: t('landing.tags.service.fill') },
    { label: t('landing.tags.job.label'), fill: t('landing.tags.job.fill') },
  ]

  const STEP_NAMES = [t('landing.step.write'), t('landing.step.ai'), t('landing.step.signup')]

  const REG_QUESTIONS = [
    { key: 'name', question: t('landing.reg.nameQuestion'), type: 'text', placeholder: t('landing.reg.namePlaceholder') },
    { key: 'email', question: t('landing.reg.emailQuestion'), type: 'email', placeholder: 'your@email.com' },
    { key: 'password', question: t('landing.reg.passwordQuestion'), type: 'password', placeholder: '••••••••' },
  ]

  const toggleLocale = () => {
    i18n.changeLanguage(i18n.language === 'uk' ? 'en' : 'uk')
  }

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
  const [secondGoalMode, setSecondGoalMode] = useState(false)

  const startRegFields = () => {
    setRegMode(true)
    setRegStep(0)
    setForm({ name: '', email: '', password: '', city: '' })
    setMsgs(prev => [
      ...prev,
      { role: 'assistant', content: t('landing.chat.signupBridge'), kind: 'reg' },
      { role: 'assistant', content: REG_QUESTIONS[0].question, kind: 'reg' },
    ])
    setChips([])
  }

  const sendToAI = async (messages: ChatMsg[]) => {
    setChatLoading(true)
    try {
      // filter out card-only messages (empty content) before sending to AI
      const apiMessages = messages.filter(m => m.content.trim() !== '')
      const raw = await callAI({ messages: apiMessages, locale: i18n.language })
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
        }
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: t('landing.chat.error') }])
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

    // for second goal: start a fresh AI context so it doesn't inherit first goal's details
    const newMsgs: ChatMsg[] = secondGoalMode
      ? [{ role: 'user', content: text }]
      : [...msgs.filter(m => m.content.trim() !== ''), { role: 'user', content: text }]
    await sendToAI(newMsgs)
  }

  // Card is a best-guess draft, not a final answer — let the user correct it inline instead of asking
  const updateCardField = (cardIndex: 0 | 1, field: 'category' | 'budgetMin' | 'budgetMax', value: string) => {
    const numericFields = field === 'budgetMin' || field === 'budgetMax'
    const nextValue = numericFields ? Number(value) || 0 : value
    const apply = (r: AIResult | null) => r ? { ...r, [field]: nextValue } : r
    if (cardIndex === 0) setAiResult(apply)
    else setSecondAiResult(apply)
    setMsgs(prev => prev.map(m => m.card && m.cardIndex === cardIndex ? { ...m, card: apply(m.card) as AIResult } : m))
  }

  const handleAddSecondGoal = () => {
    setSecondGoalMode(true)
    setMsgs(prev => [...prev, { role: 'assistant', content: t('landing.chat.secondGoalPrompt') }])
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const handleRegInput = async () => {
    const field = REG_QUESTIONS[regStep]
    const val = chatInput.trim()
    if (!val) return
    if (field.key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError(t('landing.reg.errorEmail')); return
    }
    if (field.key === 'password' && val.length < 8) {
      setError(t('landing.reg.errorPassword')); return
    }
    setError('')
    const displayVal = field.key === 'password' ? '••••••••' : val
    setMsgs(prev => [...prev, { role: 'user', content: displayVal, kind: 'reg' }])
    setForm(prev => ({ ...prev, [field.key]: val }))
    setChatInput('')

    const updatedForm = { ...form, [field.key]: val }

    if (regStep < REG_QUESTIONS.length - 1) {
      const next = REG_QUESTIONS[regStep + 1]
      setTimeout(() => {
        setMsgs(prev => [...prev, { role: 'assistant', content: next.question, kind: 'reg' }])
        setRegStep(s => s + 1)
      }, 300)
    } else {
      // all fields collected → register (or just publish if already authenticated)
      setTimeout(async () => {
        const goalCount = secondAiResult ? 2 : 1
        setMsgs(prev => [...prev, { role: 'assistant', content: goalCount === 2 ? t('landing.chat.publishingTwo') : t('landing.chat.publishingOne'), kind: 'reg' }])
        setAuthLoading(true)
        try {
          // City comes from what the user actually said in the AI conversation — never a hardcoded default.
          const city = updatedForm.city || aiResult?.city || secondAiResult?.city || undefined

          // Save pending entries to localStorage BEFORE signIn so auth token is ready when Dashboard reads them
          const pending = []
          if (aiResult) pending.push({ title: aiResult.title ?? task.slice(0, 80), description: task, intentType: aiResult.intentType, entryType: aiResult.entryType ?? 'on_demand', category: aiResult.category, city: aiResult.city || city, budgetMin: aiResult.budgetMin, budgetMax: aiResult.budgetMax })
          if (secondAiResult) { const t2 = msgs.find(m => m.cardIndex === 1)?.card?.title ?? secondAiResult.title ?? ''; pending.push({ title: secondAiResult.title ?? t2.slice(0, 80), description: t2, intentType: secondAiResult.intentType, entryType: secondAiResult.entryType ?? 'on_demand', category: secondAiResult.category, city: secondAiResult.city || city, budgetMin: secondAiResult.budgetMin, budgetMax: secondAiResult.budgetMax }) }
          if (pending.length > 0) localStorage.setItem('otaska_pending_entries', JSON.stringify(pending))

          await signIn('password', { email: updatedForm.email, password: updatedForm.password, name: updatedForm.name, flow: 'signUp' })

          navigate('/app', { state: { newRegistration: { city, name: updatedForm.name } } })
        } catch (err: unknown) {
          const msg = (err as Error)?.message ?? ''
          setMsgs(prev => [...prev, { role: 'assistant', content: msg.includes('already') ? t('landing.chat.emailTaken') : t('landing.chat.registerError'), kind: 'reg' }])
          setRegMode(false)
        } finally {
          setAuthLoading(false)
        }
      }, 300)
    }
  }


  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page:     { minHeight: '100dvh', background: 'var(--bg-page)', color: 'var(--text-primary)', fontFamily: "system-ui,-apple-system,sans-serif" } as const,
    nav:      { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,244,241,.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' } as const,
    navInner: { maxWidth: 640, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
    wrap:     { maxWidth: 640, margin: '0 auto', padding: '0 20px' } as const,
    card:     { background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: 28 } as const,
    inputEl:  { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 16, color: 'var(--text-primary)', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' } as const,
    btnAmber: { width: '100%', padding: 16, borderRadius: 12, background: 'var(--accent)', color: 'var(--text-primary)', fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' } as const,
    btnGhost: { flex: 1, padding: 15, borderRadius: 12, background: 'transparent', color: 'var(--text-tertiary)', fontFamily: 'system-ui', fontSize: 16, fontWeight: 500, border: '1.5px solid var(--border)', cursor: 'pointer' } as const,
    back:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', marginBottom: 32, padding: 0 } as const,
  }

  const Dots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: i === step ? 20 : 8, height: 8, borderRadius: 99,
          background: i === step ? 'var(--accent)' : i < step ? 'var(--accent)' : 'var(--border)',
          opacity: i < step ? 0.5 : 1, transition: 'all .3s',
        }} />
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 6, letterSpacing: '.3px', textTransform: 'uppercase' }}>
        {STEP_NAMES[step - 1]}
      </span>
    </div>
  )

  const QuestionMark = () => (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M11 10C11 7.2 13.2 5 16 5C18.8 5 21 7.2 21 10C21 12.8 18.8 14 16 14V17" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2" fill="var(--accent)" />
    </svg>
  )

  const BackArrow = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )

  const UserIcon = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.2" r="2.6" />
      <path d="M2.8 13.2c.9-2.6 2.9-4 5.2-4s4.3 1.4 5.2 4" />
    </svg>
  )

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={28} />
          </a>
          <Dots />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={toggleLocale} aria-label="Switch language" style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', background: '#fff',
              border: '1px solid var(--border)', borderRadius: 99, padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'system-ui',
            }}>
              {i18n.language === 'uk' ? 'EN' : 'UA'}
            </button>
            <button onClick={() => navigate('/register')} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui' }}>
              {t('landing.register')}
            </button>
            <button onClick={() => navigate('/login')} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui' }}>
              {t('landing.login')}
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ STEP 1: WRITE ═══ */}
      {step === 1 && (
        <div style={{ ...S.wrap, padding: '60px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
<h1 style={{ fontSize: 'clamp(40px,7vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: 'var(--text-primary)', marginBottom: 14 }}>
            {t('landing.hero.title1')}<br /><span style={{ color: 'var(--accent)' }}>{t('landing.hero.title2')}</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
            {t('landing.hero.subtitle1')}<br />{t('landing.hero.subtitle2')}
          </p>

          <div style={{ width: '100%', marginBottom: 16 }}>
            <div style={{
              background: '#fff',
              border: `1.5px solid ${focused || task ? 'var(--accent)' : 'var(--border)'}`,
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
                placeholder={t('landing.form.placeholder')}
                rows={4}
                style={{ width: '100%', fontSize: 18, color: 'var(--text-primary)', border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.55, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {/* Live AI status while typing */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  {task.length >= 6 && aiResult ? (
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {aiResult.emoji} {aiResult.category === t('landing.chat.categoryGeneric') ? t('landing.form.recognized') : aiResult.category}
                    </span>
                  ) : (
                    <>
                      {['0s', '.2s', '.4s'].map((d, i) => (
                        <span key={i} style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `dotA 1.3s ease-in-out ${d} infinite` }} />
                      ))}
                      <span style={{ color: 'var(--text-dim)', marginLeft: 2 }}>{t('landing.form.recognizing')}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={goStep2}
                  disabled={task.trim().length < 5}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    cursor: task.trim().length >= 5 ? 'pointer' : 'not-allowed',
                    background: task.trim().length >= 5 ? 'var(--text-primary)' : 'var(--border)',
                    color: task.trim().length >= 5 ? '#fff' : 'var(--text-dim)',
                    fontFamily: 'system-ui', fontSize: 15, fontWeight: 600, transition: 'all .18s',
                  }}
                >
                  {t('landing.form.next')}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TAGS.map(tag => (
              <button key={tag.label}
                onClick={() => { setTask(tag.fill); setAiResult(null); textareaRef.current?.focus() }}
                style={{ padding: '8px 16px', borderRadius: 20, background: '#fff', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 500, fontFamily: 'system-ui' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
              >
                {tag.label}
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
            <button onClick={() => setStep(1)} style={S.back}><BackArrow /> {t('landing.chat.back')}</button>

            {msgs.map((m, i) => m.card ? (
              <div key={i}>
                <div style={{ background: '#fff', border: '2px solid var(--accent)', borderRadius: 16, padding: '12px 16px', marginBottom: 8, boxShadow: '0 4px 20px rgba(239,159,39,.12)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    {t('landing.chat.goal')}{secondAiResult ? ` ${(m.cardIndex ?? 0) + 1}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{m.card.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{m.card.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.card.details}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                    <select
                      value={m.card.category}
                      onChange={e => updateCardField((m.cardIndex ?? 0) as 0 | 1, 'category', e.target.value)}
                      style={{ padding: '5px 10px', borderRadius: 99, border: 'none', background: 'var(--bg-accent-tint)', color: 'var(--text-on-accent)', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}
                    >
                      {[...CATEGORIES.filter(c => c !== 'Всі'), m.card.category].filter((c, idx, arr) => arr.indexOf(c) === idx).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>€</span>
                      <input type="number" value={m.card.budgetMin}
                        onChange={e => updateCardField((m.cardIndex ?? 0) as 0 | 1, 'budgetMin', e.target.value)}
                        style={{ width: 52, padding: '4px 6px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--accent-strong)', fontFamily: 'inherit', textAlign: 'right' as const }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>–</span>
                      <input type="number" value={m.card.budgetMax}
                        onChange={e => updateCardField((m.cardIndex ?? 0) as 0 | 1, 'budgetMax', e.target.value)}
                        style={{ width: 52, padding: '4px 6px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--accent-strong)', fontFamily: 'inherit', textAlign: 'right' as const }} />
                    </div>
                  </div>
                </div>

                {/* Action buttons — only under the latest first-goal card, before reg starts */}
                {(m.cardIndex ?? 0) === 0 && i === msgs.length - 1 && !secondAiResult && !regMode && !secondGoalMode && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                    <button onClick={handleAddSecondGoal}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>
                      {t('landing.chat.addGoal')}
                    </button>
                    <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <button onClick={startRegFields}
                        style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'system-ui', cursor: 'pointer' }}>
                        {t('landing.chat.publish')}
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('landing.reg.publishNote')}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div key={i}>
                {m.kind === 'reg' && (i === 0 || msgs[i - 1].kind !== 'reg') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: 'var(--text-secondary)', textTransform: 'uppercase' as const }}>
                      {t('landing.chat.accountSetup')}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.kind === 'reg' ? 'var(--text-primary)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                      {m.kind === 'reg' ? <UserIcon /> : <span style={{ fontSize: 14 }}>✦</span>}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user' ? 'var(--text-primary)' : '#fff',
                    color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: 15, lineHeight: 1.5,
                    border: m.role === 'assistant' ? (m.kind === 'reg' ? '1.5px solid var(--text-primary)' : '1.5px solid var(--border)') : 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>✦</span>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#fff', border: '1.5px solid var(--border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `dotA 1.3s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          {(!aiResult || regMode || secondGoalMode) && (
            <div style={{ padding: '12px 16px 20px', background: 'var(--bg-page)', borderTop: '1px solid var(--border)' }}>
              {!regMode && chips.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                  {chips.map(c => (
                    <button key={c} onClick={() => sendUserMessage(c)}
                      style={{ padding: '8px 16px', borderRadius: 20, background: '#fff', border: '1.5px solid var(--border)', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 500 }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    >{c}</button>
                  ))}
                </div>
              )}
              {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>{error}</p>}
              <form onSubmit={e => { e.preventDefault(); regMode ? handleRegInput() : sendUserMessage(chatInput) }} style={{ display: 'flex', gap: 8 }}>
                <input
                  key={regMode ? `reg-${regStep}` : 'chat'}
                  type={regMode ? REG_QUESTIONS[regStep]?.type : 'text'}
                  value={chatInput}
                  onChange={e => { setChatInput(e.target.value); setError('') }}
                  placeholder={regMode ? REG_QUESTIONS[regStep]?.placeholder : t('landing.chat.inputPlaceholder')}
                  autoFocus={regMode}
                  autoComplete={regMode && REG_QUESTIONS[regStep]?.key === 'password' ? 'new-password' : regMode && REG_QUESTIONS[regStep]?.key === 'email' ? 'email' : 'off'}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading || authLoading}
                  style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--text-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, opacity: !chatInput.trim() || chatLoading || authLoading ? 0.4 : 1 }}
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
