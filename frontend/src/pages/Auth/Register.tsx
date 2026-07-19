import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { Logo } from '../../components/layout/Logo'

export function Register() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Пароль має бути щонайменше 8 символів')
      return
    }
    setLoading(true)
    try {
      await signIn('password', { email, password, name, flow: 'signUp' })
      navigate('/app')
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? ''
      setError(msg.includes('already') ? 'Цей email вже зареєстровано' : 'Не вдалося зареєструватись. Спробуй ще раз')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)', fontSize: 16, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--text-primary)',
    background: 'var(--bg-field)', transition: 'border-color .15s',
  }
  const focusField = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--accent)' }
  const blurField = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border)' }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'inherit',
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={52} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', letterSpacing: '-.5px' }}>Реєстрація</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>Створи акаунт за хвилину</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Ім'я</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              required placeholder="Твоє ім'я"
              style={fieldStyle}
              onFocus={focusField}
              onBlur={blurField}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="your@email.com"
              style={fieldStyle}
              onFocus={focusField}
              onBlur={blurField}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="Щонайменше 8 символів"
              style={fieldStyle}
              onFocus={focusField}
              onBlur={blurField}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 14, textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 16, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
            background: 'var(--dark)', color: 'var(--text-on-dark)', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Реєструємо...' : 'Зареєструватись'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--text-secondary)', marginTop: 20 }}>
          Вже є акаунт?{' '}
          <button onClick={() => navigate('/login')} style={{ color: 'var(--accent-strong)', fontWeight: 700, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>
            Увійти
          </button>
        </p>
      </div>
    </div>
  )
}
