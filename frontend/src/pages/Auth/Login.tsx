import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { Logo } from '../../components/layout/Logo'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn('password', { email, password, flow: 'signIn' })
      navigate('/app')
    } catch {
      setError('Невірний email або пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F2F2F7',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={52} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Вхід</h1>
          <p style={{ fontSize: 15, color: '#8E8E93', margin: 0 }}>Раді бачити знову</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="your@email.com"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #E5E5EA', fontSize: 17, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #E5E5EA', fontSize: 17, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: '#FF3B30', fontSize: 14, marginBottom: 14, textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#111111', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 15, color: '#8E8E93', marginTop: 20 }}>
          Немає акаунту?{' '}
          <button onClick={() => navigate('/')} style={{ color: '#111111', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>
            Реєстрація
          </button>
        </p>
      </div>
    </div>
  )
}
