import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const me = useQuery(api.users.getMe)
  const updateProfile = useMutation(api.users.updateProfile)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', phone: '' })
  const [saving, setSaving] = useState(false)

  if (me === undefined) {
    return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
  }

  const displayName = me?.name ?? me?.email?.split('@')[0] ?? 'Користувач'
  const email = me?.email ?? ''
  const emailVerified = (me as { emailVerificationTime?: number } | null)?.emailVerificationTime != null
  const city = me?.profile?.city ?? ''
  const phone = me?.profile?.phone ?? ''
  const rating = me?.profile?.rating ?? 0
  const jobs = me?.profile?.jobsCompleted ?? 0

  const startEdit = () => {
    setForm({ name: displayName, city, phone })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ name: form.name || undefined, city: form.city || undefined, phone: form.phone || undefined })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar
        title="Профіль"
        showBack={false}
        right={
          <button onClick={editing ? () => setEditing(false) : startEdit}
            style={{ color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, fontFamily: 'inherit' }}>
            {editing ? 'Скасувати' : 'Редагувати'}
          </button>
        }
      />

      <div style={{ padding: '16px 16px 0' }}>

        {/* Email verification banner */}
        {!emailVerified && (
          <div style={{ background: 'rgba(255,149,0,.12)', border: '1.5px solid rgba(255,149,0,.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>✉️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#B45309', marginBottom: 2 }}>Підтвердіть email</div>
              <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.4 }}>
                Перевірте пошту <strong>{email}</strong> та натисніть посилання для підтвердження акаунту.
              </div>
            </div>
          </div>
        )}

        {/* Avatar card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 16px', boxShadow: '0 1px 8px rgba(0,0,0,.07)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#111 0%,#333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {displayName[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.3px' }}>{displayName}</div>
            <div style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>
              {city ? `📍 ${city}` : email}
            </div>
            {rating > 0 && (
              <div style={{ display: 'flex', gap: 2, marginTop: 6, alignItems: 'center' }}>
                {'⭐'.repeat(Math.round(rating))}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FF9500', marginLeft: 4 }}>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {emailVerified && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', background: 'rgba(0,122,255,.1)', padding: '4px 10px', borderRadius: 20, alignSelf: 'flex-start' }}>
              ✓ Верифіковано
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { val: rating > 0 ? rating.toFixed(1) : '—', label: 'Рейтинг', color: '#FF9500' },
            { val: jobs > 0 ? jobs : '—', label: 'Виконано', color: '#34C759' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 8px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 12 }}>
            {[
              { key: 'name', label: "ІМ'Я", placeholder: 'Ваше ім\'я' },
              { key: 'city', label: 'МІСТО', placeholder: 'Братислава' },
              { key: 'phone', label: 'ТЕЛЕФОН', placeholder: '+421 ...' },
            ].map(({ key, label, placeholder }, i, arr) => (
              <div key={key} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '0.5px solid #F2F2F7' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>{label}</div>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}

        {editing && (
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#111', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit', marginBottom: 12 }}>
            {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
          </button>
        )}

        {/* Account info */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, marginTop: 4 }}>Акаунт</div>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 16 }}>
          {[
            { icon: '📧', label: 'Email', value: email, extra: emailVerified ? <span style={{ fontSize: 12, color: '#34C759', fontWeight: 600 }}>✓ підтверджено</span> : <span style={{ fontSize: 12, color: '#FF9500', fontWeight: 600 }}>не підтверджено</span> },
            { icon: '📍', label: 'Місто', value: city || '—' },
            { icon: '📱', label: 'Телефон', value: phone || '—' },
          ].map(({ icon, label, value, extra }, i, arr) => (
            <div key={label} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '0.5px solid #F2F2F7' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 15 }}>{label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontSize: 14, color: '#8E8E93' }}>{value}</span>
                {extra}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => signOut().then(() => navigate('/'))} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,.08)', color: '#FF3B30', fontSize: 17, fontWeight: 600, fontFamily: 'inherit' }}>
          Вийти
        </button>
      </div>
    </div>
  )
}
