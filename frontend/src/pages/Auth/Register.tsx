import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Logo } from '../../components/layout/Logo'

export function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', first_task: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        city: form.city || undefined,
        first_task: form.first_task || undefined,
      })
      navigate('/app')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Помилка реєстрації')
    }
  }

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div style={{
      minHeight: '100dvh', background: '#F2F2F7',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={52} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Реєстрація</h1>
          <p style={{ fontSize: 15, color: '#8E8E93', margin: 0 }}>Просто напиши — AI знайде</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
          {[
            { key: 'name', label: "Ім'я", type: 'text', placeholder: "Ваше ім'я", required: true },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
            { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••• (мін. 6)', required: true },
            { key: 'city', label: 'Місто', type: 'text', placeholder: 'Братислава, Прага, Варшава...', required: false },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={update(key)}
                required={required} placeholder={placeholder}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #E5E5EA', fontSize: 17, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', display: 'block', marginBottom: 6 }}>
              Перший запис <span style={{ fontWeight: 400, color: '#C7C7CC' }}>(необов'язково)</span>
            </label>
            <textarea value={form.first_task} onChange={update('first_task')}
              placeholder="Напиши що тобі потрібно або що пропонуєш..."
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #E5E5EA',
                fontSize: 15, outline: 'none', resize: 'none', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
              }} />
          </div>

          {error && <div style={{ color: '#FF3B30', fontSize: 14, marginBottom: 14, textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#111111', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,0,0,.2)',
          }}>
            {loading ? 'Реєструємо...' : 'Зареєструватись →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 15, color: '#8E8E93', marginTop: 20 }}>
          Вже є акаунт?{' '}
          <Link to="/login" style={{ color: '#111111', fontWeight: 600, textDecoration: 'none' }}>Увійти</Link>
        </p>
      </div>
    </div>
  )
}
