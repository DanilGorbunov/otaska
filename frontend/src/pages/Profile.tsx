import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { profileApi } from '../lib/api'

export function Profile() {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
    bio: user?.provider_profile?.bio ?? '',
    skills: user?.provider_profile?.skills?.join(', ') ?? '',
    hourly_rate: user?.provider_profile?.hourly_rate?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await profileApi.update({
        name: form.name,
        phone: form.phone || undefined,
        city: form.city || undefined,
        bio: form.bio || undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
      })
      setUser(res.data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
        height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Профіль</h2>
        <button onClick={() => editing ? setEditing(false) : setEditing(true)}
          style={{ color: '#111111', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17 }}>
          {editing ? 'Скасувати' : 'Редагувати'}
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff',
          }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 15, color: '#8E8E93' }}>
              {user.city && `${user.city} · `}з {new Date(user.created_at).getFullYear()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
          {[
            { val: user.provider_profile?.rating?.toFixed(1) ?? '—', label: 'Рейтинг' },
            { val: user.provider_profile?.jobs_completed ?? 0, label: 'Виконано' },
            { val: '—', label: 'Баланс' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit form or Skills display */}
        {editing ? (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16 }}>
            {[
              { key: 'name', label: 'Ім\'я', placeholder: 'Ваше ім\'я' },
              { key: 'phone', label: 'Телефон', placeholder: '+421...' },
              { key: 'city', label: 'Місто', placeholder: 'Братислава' },
              { key: 'bio', label: 'Про себе', placeholder: 'Короко про досвід...' },
              { key: 'skills', label: 'Навички', placeholder: 'Електрика, Сантехніка...' },
              { key: 'hourly_rate', label: 'Ставка €/год', placeholder: '20' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ padding: '12px 16px', borderBottom: '0.5px solid #E5E5EA' }}>
                <div style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>{label}</div>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ padding: 16 }}>
              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: '#000', color: '#fff', fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
              }}>
                {saving ? 'Зберігаємо...' : 'Зберегти'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {user.provider_profile?.skills && user.provider_profile.skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                  Навички
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {user.provider_profile.skills.map(s => (
                    <span key={s} style={{
                      padding: '6px 14px', borderRadius: 99, background: 'rgba(0,0,0,.05)',
                      color: '#333333', fontSize: 13, fontWeight: 600,
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Settings */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          Акаунт
        </div>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 24 }}>
          {[
            { icon: '🌐', label: 'Мова', value: '🇺🇦 Українська' },
            { icon: '👤', label: 'Підтвердити особу', value: user.verified ? '✓' : '›' },
            { icon: '📧', label: 'Email', value: user.email },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #E5E5EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 15 }}>{label}</span>
              </div>
              <span style={{ fontSize: 15, color: '#8E8E93' }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { logout(); navigate('/login') }} style={{
          width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'rgba(255,59,48,.1)', color: '#FF3B30', fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
        }}>
          Вийти
        </button>
      </div>
    </div>
  )
}
