import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { aiApi } from '../lib/api'
import axios from 'axios'

type Step = 1 | 2 | 3 | 4

const TAGS = [
  { label: '🔧 Шукаю майстра',    fill: 'Шукаю майстра для ремонту в квартирі' },
  { label: '🪨 Шукаю матеріали',  fill: 'Потрібен щебінь 40т для будівництва' },
  { label: '💼 Пропоную послугу', fill: 'Роблю електрику — доступний з понеділка' },
  { label: '👷 Шукаю роботу',     fill: 'Шукаю роботу будівельника, досвід 5 років' },
]

const STEP_NAMES = ['WRITE', 'AI', 'REGISTER', 'DONE']

interface AIResult {
  category: string
  emoji: string
  min: number
  max: number
  duration: string
  desc: string
  intent_type: string
  entry_type: string
}

export function Landing() {
  const navigate = useNavigate()
  const { register, loading: authLoading } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [task, setTask] = useState('')
  const [focused, setFocused] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' })
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const EMOJI_MAP: Record<string, string> = {
    electric: '⚡', plumbing: '🔧', renovation: '🏗️', painting: '🎨',
    tiling: '🪟', carpentry: '🪚', materials: '🪨', labor: '👷',
    moving: '📦', demolition: '⛏️', other: '🔨',
  }

  const goStep2 = async () => {
    if (task.trim().length < 5) return
    setStep(2)
    setAiLoading(true)
    try {
      // public endpoint — no auth needed
      const [cat, est] = await Promise.all([
        axios.post('/api/public/categorize', { text: task, city: form.city || 'Bratislava' }),
        axios.post('/api/public/estimate',   { text: task, city: form.city || 'Bratislava' }),
      ])
      const c = cat.data
      const e = est.data
      setAiResult({
        category:   c.category,
        emoji:      EMOJI_MAP[c.category] ?? '🔨',
        min:        e.min,
        max:        e.max,
        duration:   e.duration,
        desc:       e.basis,
        intent_type: c.intent_type,
        entry_type:  c.entry_type,
      })
    } catch {
      // fallback: just show the task
      setAiResult({ category: 'Послуга', emoji: '🔨', min: 50, max: 200, duration: '1–3 дні', desc: '', intent_type: 'seeking_service', entry_type: 'on_demand' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Заповни ім'я, email і пароль")
      return
    }
    setError('')
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        city: form.city || undefined,
        first_task: task,
      })
      setStep(4)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Помилка реєстрації')
    }
  }

  const goApp = () => navigate('/app')

  // ─── styles ──────────────────────────────────────────────────────────────

  const S = {
    page:   { minHeight: '100dvh', background: '#F5F4F1', color: '#1A1612', fontFamily: "system-ui,-apple-system,sans-serif" } as const,
    nav:    { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,244,241,.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8DF' } as const,
    navInner: { maxWidth: 640, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
    wrap:   { maxWidth: 640, margin: '0 auto', padding: '0 20px' } as const,
    card:   { background: '#fff', border: '1.5px solid #EDE8DF', borderRadius: 16, padding: 28 } as const,
    inputEl: { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 16, color: '#1A1612', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' } as const,
    btnAmber: { width: '100%', padding: 16, borderRadius: 12, background: '#EF9F27', color: '#1A1612', fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '-.2px' } as const,
    btnGhost: { flex: 1, padding: 15, borderRadius: 12, background: 'transparent', color: '#5A4A2E', fontFamily: 'system-ui', fontSize: 16, fontWeight: 500, border: '1.5px solid #EDE8DF', cursor: 'pointer' } as const,
    back:   { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#9A8060', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', marginBottom: 32, padding: 0 } as const,
  }

  // Dots
  const Dots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: i === step ? 20 : 8, height: 8, borderRadius: 99,
          background: i === step ? '#EF9F27' : i < step ? '#EF9F27' : '#EDE8DF',
          opacity: i < step ? 0.5 : 1,
          transition: 'all .3s',
        }} />
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9A8060', marginLeft: 6, letterSpacing: '.3px', textTransform: 'uppercase' }}>
        {STEP_NAMES[step - 1]}
      </span>
    </div>
  )

  // Hexagon logo
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
      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <QuestionMark />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.3px' }}>
              <span style={{ color: '#EF9F27', fontWeight: 800 }}>O</span>
              <span style={{ color: '#1A1612' }}>Taska</span>
            </span>
          </a>
          <Dots />
          <button onClick={() => navigate('/login')} style={{ fontSize: 14, fontWeight: 500, color: '#9A8060', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui' }}>
            Sign in
          </button>
        </div>
      </nav>

      {/* ════════════════ STEP 1: WRITE ════════════════ */}
      {step === 1 && (
        <div style={{ ...S.wrap, padding: '60px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Hex icon */}
          <div style={{ marginBottom: 28, animation: 'hexPulse 2.5s ease-in-out infinite' }}>
            <Hex size={64} />
          </div>

          {/* Hero */}
          <h1 style={{ fontSize: 'clamp(40px,7vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: '#1A1612', marginBottom: 14 }}>
            Just write it<br />
            <span style={{ color: '#EF9F27' }}>down.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#9A8060', lineHeight: 1.65, marginBottom: 36, maxWidth: 460, fontWeight: 400 }}>
            Need something done? Looking for work?<br />
            Write it like a note — we handle the rest.
          </p>

          {/* Main input */}
          <div style={{ width: '100%', marginBottom: 16 }}>
            <div style={{
              background: '#fff',
              border: `1.5px solid ${focused || task ? '#EF9F27' : '#EDE8DF'}`,
              borderRadius: 16, padding: 20,
              transition: 'border-color .2s, box-shadow .2s',
              boxShadow: focused ? '0 0 0 4px rgba(239,159,39,.12)' : '0 2px 12px rgba(0,0,0,.04)',
            }}>
              <textarea
                ref={textareaRef}
                value={task}
                onChange={e => setTask(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="plumber available Mon–Fri..."
                rows={4}
                style={{ width: '100%', fontSize: 18, color: '#1A1612', border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.55, letterSpacing: '-.2px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #EDE8DF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {['0s', '.2s', '.4s'].map((delay, i) => (
                    <span key={i} style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#EF9F27', animation: `dotA 1.3s ease-in-out ${delay} infinite` }} />
                  ))}
                  <span style={{ fontSize: 13, color: '#B4A898', marginLeft: 4 }}>AI розпізнає намір</span>
                </div>
                <button
                  onClick={goStep2}
                  disabled={task.trim().length < 5}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: task.trim().length >= 5 ? 'pointer' : 'not-allowed',
                    background: task.trim().length >= 5 ? '#1A1612' : '#EDE8DF',
                    color: task.trim().length >= 5 ? '#fff' : '#B4A898',
                    fontFamily: 'system-ui', fontSize: 15, fontWeight: 600,
                    transition: 'all .18s',
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TAGS.map(t => (
              <button key={t.label} onClick={() => { setTask(t.fill); textareaRef.current?.focus() }}
                style={{ padding: '8px 16px', borderRadius: 20, background: '#fff', border: '1px solid #EDE8DF', fontSize: 14, color: '#5A4A2E', cursor: 'pointer', fontWeight: 500, fontFamily: 'system-ui', transition: 'all .15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#EF9F27'; e.currentTarget.style.color = '#EF9F27' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.color = '#5A4A2E' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ STEP 2: AI ════════════════ */}
      {step === 2 && (
        <div style={{ ...S.wrap, padding: '40px 20px 80px' }}>
          <button onClick={() => setStep(1)} style={S.back}><BackArrow /> Back</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#9A8060', marginBottom: 16, letterSpacing: '.3px', textTransform: 'uppercase' as const }}>
            Схоже ти шукаєш:
          </div>

          {aiLoading ? (
            <div style={S.card}>
              {[55, 75, 40, 50, 35].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? 22 : i === 1 ? 16 : 14, width: `${w}%`, borderRadius: 8, marginBottom: i < 4 ? (i < 2 ? 16 : 8) : 0, background: 'linear-gradient(90deg,#EDE8DF 25%,#F5F0EA 50%,#EDE8DF 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          ) : aiResult && (
            <>
              <div style={{ ...S.card, marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1612', marginBottom: 6, letterSpacing: '-.5px' }}>
                  {aiResult.emoji} {aiResult.category} · Братислава
                </div>
                <div style={{ fontSize: 15, color: '#9A8060', marginBottom: 24, lineHeight: 1.5 }}>
                  {aiResult.desc || task.slice(0, 120)}
                </div>
                <div style={{ paddingTop: 20, borderTop: '1px solid #EDE8DF' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: 6 }}>
                    Орієнтовна ціна
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#EF9F27', letterSpacing: -1, marginBottom: 4 }}>
                    €{aiResult.min} — €{aiResult.max}
                  </div>
                  <div style={{ fontSize: 14, color: '#B4A898' }}>{aiResult.duration}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 15, borderRadius: 12, background: '#EF9F27', color: '#1A1612', fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .18s' }}>
                  Так, вірно →
                </button>
                <button onClick={() => setStep(1)} style={S.btnGhost}>
                  Уточнити
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════ STEP 3: REGISTER ════════════════ */}
      {step === 3 && (
        <div style={{ ...S.wrap, padding: '40px 20px 80px' }}>
          <button onClick={() => setStep(2)} style={S.back}><BackArrow /> Back</button>

          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1A1612', letterSpacing: -1, marginBottom: 8 }}>
            Майже готово
          </h2>
          <p style={{ fontSize: 15, color: '#9A8060', marginBottom: 32 }}>
            Ще один крок — і твій запис буде опублікований
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Task summary pill */}
            {aiResult && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF6E8', border: '1px solid #F5D99A', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{aiResult.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8A6020', lineHeight: 1.4 }}>
                  {aiResult.category} · €{aiResult.min}–{aiResult.max}
                </span>
              </div>
            )}

            {/* Form fields */}
            {[
              { key: 'name',     label: "Ім'я",   type: 'text',     placeholder: "Ваше ім'я",       required: true },
              { key: 'email',    label: 'Email',  type: 'email',    placeholder: 'your@email.com',   required: true },
              { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••• (мін. 6)', required: true },
              { key: 'city',     label: 'Місто',  type: 'text',     placeholder: 'Bratislava',       required: false },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9A8060', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
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

            <button onClick={handleRegister} disabled={authLoading}
              style={{ ...S.btnAmber, opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? 'Публікуємо...' : 'Опублікувати запис →'}
            </button>

            <p style={{ fontSize: 12, color: '#B4A898', textAlign: 'center' }}>
              Реєструючись ти погоджуєшся з{' '}
              <a href="#" style={{ color: '#EF9F27', fontWeight: 500 }}>умовами використання</a>
            </p>

            <p style={{ fontSize: 14, color: '#9A8060', textAlign: 'center' }}>
              Вже є акаунт?{' '}
              <button onClick={() => navigate('/login')} style={{ color: '#EF9F27', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 14 }}>
                Увійти
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ════════════════ STEP 4: DONE ════════════════ */}
      {step === 4 && (
        <div style={{ ...S.wrap, padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: 28, animation: 'hexPulse 2s ease-in-out infinite' }}>
            <Hex size={80} />
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1A1612', letterSpacing: -1, marginBottom: 16 }}>
            Твій запис опублікований!
          </h2>

          {aiResult && (
            <div style={{ padding: '16px 24px', borderRadius: 14, background: '#fff', border: '1.5px solid #EDE8DF', marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{aiResult.emoji}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1612' }}>
                {aiResult.category} · Братислава · €{aiResult.min}–{aiResult.max}
              </span>
            </div>
          )}

          <div style={{ fontSize: 15, color: '#9A8060', marginBottom: 8, lineHeight: 1.6 }}>
            🔍 Знаходимо збіг...
          </div>
          <div style={{ fontSize: 14, color: '#B4A898', marginBottom: 36 }}>
            Ми повідомимо коли хтось відгукнеться
          </div>

          <button onClick={goApp} style={{ ...S.btnAmber, maxWidth: 360 }}>
            Відкрити мій список →
          </button>
        </div>
      )}

      <style>{`
        @keyframes hexPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes dotA { 0%,80%,100%{opacity:.25;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}
