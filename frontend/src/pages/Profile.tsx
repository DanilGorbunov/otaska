import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const SKILL_OPTIONS = ['Електрик', 'Сантехнік', 'Маляр', 'Тесля', 'Зварник', 'Плиточник', 'Вантажник', 'Прибирання', 'Ремонт техніки', 'IT']

export function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const me = useQuery(api.users.getMe)
  const updateProfile = useMutation(api.users.updateProfile)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', phone: '', bio: '', hourlyRate: '', availability: '' })
  const [isProvider, setIsProvider] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
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
  const providerMode = me?.profile?.isProvider ?? false

  const startEdit = () => {
    setForm({
      name: displayName,
      city,
      phone,
      bio: me?.profile?.bio ?? '',
      hourlyRate: me?.profile?.hourlyRate?.toString() ?? '',
      availability: me?.profile?.availability ?? '',
    })
    setIsProvider(providerMode)
    setSkills(me?.profile?.skills ?? [])
    setEditing(true)
  }

  const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: form.name || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        isProvider,
        skills: skills.length > 0 ? skills : undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        availability: form.availability || undefined,
      })
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
                Перевірте пошту <strong>{email}</strong> та натисніть посилання.
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.3px' }}>{displayName}</div>
              {providerMode && <span style={{ fontSize: 11, fontWeight: 700, color: '#EF9F27', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20 }}>Майстер</span>}
            </div>
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
          <>
            {/* Provider toggle */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Я майстер / виконавець</div>
                <div style={{ fontSize: 12, color: '#9A8060', marginTop: 2 }}>З'явлюсь у списку майстрів</div>
              </div>
              <div onClick={() => setIsProvider(p => !p)} style={{
                width: 51, height: 31, borderRadius: 99, background: isProvider ? '#34C759' : '#E5E5EA',
                cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: isProvider ? 22 : 2,
                  width: 27, height: 27, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left .2s',
                }} />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 12 }}>
              {[
                { key: 'name', label: "ІМ'Я", placeholder: 'Ваше ім\'я', type: 'text' },
                { key: 'city', label: 'МІСТО', placeholder: 'Братислава', type: 'text' },
                { key: 'phone', label: 'ТЕЛЕФОН', placeholder: '+421 ...', type: 'tel' },
                { key: 'bio', label: 'ПРО СЕБЕ', placeholder: 'Коротко про досвід...', type: 'text' },
              ].map(({ key, label, placeholder, type }, i, arr) => (
                <div key={key} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '0.5px solid #F2F2F7' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>{label}</div>
                  <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            {isProvider && (
              <>
                <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 12 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>СТАВКА €/ГОД</div>
                    <input type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                      placeholder="Наприклад: 25"
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ДОСТУПНІСТЬ</div>
                    <input value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                      placeholder="Наприклад: Пн–Пт, 9:00–18:00"
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SKILL_OPTIONS.map(s => (
                      <span key={s} onClick={() => toggleSkill(s)} style={{
                        padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: skills.includes(s) ? '#1A1612' : 'rgba(0,0,0,.06)',
                        color: skills.includes(s) ? '#fff' : '#111',
                        transition: 'all .15s',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#111', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit', marginBottom: 12 }}>
              {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
            </button>
          </>
        )}

        {/* Skills display */}
        {!editing && (me?.profile?.skills ?? []).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(me?.profile?.skills ?? []).map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: 'rgba(0,0,0,.06)', color: '#111', fontSize: 13, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Account info */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, marginTop: 4 }}>Акаунт</div>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 16 }}>
          {[
            { icon: '📧', label: 'Email', value: email, extra: emailVerified ? <span style={{ fontSize: 12, color: '#34C759', fontWeight: 600 }}>✓</span> : <span style={{ fontSize: 12, color: '#FF9500', fontWeight: 600 }}>не підтверджено</span> },
            { icon: '📍', label: 'Місто', value: city || '—' },
            { icon: '📱', label: 'Телефон', value: phone || '—' },
          ].map(({ icon, label, value, extra }, i, arr) => (
            <div key={label} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '0.5px solid #F2F2F7' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 15 }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: '#8E8E93' }}>{value}</span>
                {extra}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate(`/app/profile/${me?._id}`)}
          style={{ width: '100%', padding: 14, borderRadius: 16, border: '1.5px solid #EDE8DF', cursor: 'pointer', background: '#fff', color: '#1A1612', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', marginBottom: 10 }}>
          👁 Переглянути мій профіль
        </button>

        <button onClick={() => signOut().then(() => navigate('/'))} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,.08)', color: '#FF3B30', fontSize: 17, fontWeight: 600, fontFamily: 'inherit' }}>
          Вийти
        </button>
      </div>
    </div>
  )
}
