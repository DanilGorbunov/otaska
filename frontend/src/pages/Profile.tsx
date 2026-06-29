import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { useAuthActions } from '@convex-dev/auth/react'
import { MOCK_USER } from '../lib/mockData'

const MOCK_SKILLS = ['Електрика', 'Монтаж', 'Ремонт', 'Сантехніка']
const MOCK_STATS = { rating: 4.8, jobs: 23, balance: '€240' }

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FF9500' : 'none'} stroke={filled ? '#FF9500' : '#C7C7CC'} strokeWidth="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const user = MOCK_USER
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    phone: '+421 904 123 456',
    city: (user as typeof MOCK_USER).city ?? 'Bratislava',
    bio: 'Займаюсь ремонтними роботами в Братиславі. Якість та пунктуальність гарантую.',
    skills: MOCK_SKILLS.join(', '),
    hourly_rate: '35',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean)
  const rating = MOCK_STATS.rating
  const stars = Math.round(rating)

  return (
    <div style={{ paddingBottom: 32 }}>
      <NavBar
        title="Профіль"
        showBack={false}
        right={
          <button onClick={() => setEditing(e => !e)}
            style={{ color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, fontFamily: 'inherit', fontWeight: 400 }}>
            {editing ? 'Скасувати' : 'Редагувати'}
          </button>
        }
      />

      <div style={{ padding: '16px 16px 0' }}>

        {/* Avatar card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 20px 16px',
          boxShadow: '0 1px 8px rgba(0,0,0,.07)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#111 0%,#333 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
          }}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.3px' }}>{form.name}</div>
            <div style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>
              📍 {form.city} · з {new Date(user.created_at).getFullYear()}
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
              {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= stars} />)}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FF9500', marginLeft: 4 }}>{rating}</span>
            </div>
          </div>
          {user.verified && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#007AFF',
              background: 'rgba(0,122,255,.1)', padding: '4px 10px',
              borderRadius: 20, alignSelf: 'flex-start',
            }}>✓ Верифіковано</span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { val: MOCK_STATS.rating.toFixed(1), label: 'Рейтинг', color: '#FF9500' },
            { val: MOCK_STATS.jobs, label: 'Виконано', color: '#34C759' },
            { val: MOCK_STATS.balance, label: 'Баланс', color: '#007AFF' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '14px 8px',
              textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-.5px' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        {!editing && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              Навички
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map(s => (
                <span key={s} style={{
                  padding: '7px 14px', borderRadius: 99,
                  background: 'rgba(0,0,0,.06)', color: '#111', fontSize: 13, fontWeight: 600,
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 12 }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ІМ'Я</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ТЕЛЕФОН</div>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>МІСТО</div>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ПРО СЕБЕ</div>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', background: 'transparent', resize: 'none', minHeight: 60, boxSizing: 'border-box', lineHeight: 1.5 }} />
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>НАВИЧКИ (через кому)</div>
              <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>СТАВКА €/ГОД</div>
              <input value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                type="number"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}

        {editing && (
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#111', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
            marginBottom: 12, letterSpacing: '-.2px',
          }}>
            {saving ? 'Зберігаємо...' : saved ? '✓ Збережено' : 'Зберегти зміни'}
          </button>
        )}

        {/* Account */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, marginTop: 4 }}>
          Акаунт
        </div>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 16 }}>
          {[
            { icon: '🌐', label: 'Мова', value: '🇺🇦 Українська' },
            { icon: '👤', label: 'Особа підтверджена', value: user.verified ? '✓ Так' : '›' },
            { icon: '📧', label: 'Email', value: user.email },
            { icon: '📱', label: 'Телефон', value: form.phone },
          ].map(({ icon, label, value }, i, arr) => (
            <div key={label} style={{
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < arr.length - 1 ? '0.5px solid #F2F2F7' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 15 }}>{label}</span>
              </div>
              <span style={{ fontSize: 14, color: '#8E8E93' }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => signOut().then(() => navigate('/'))} style={{
          width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
          background: 'rgba(255,59,48,.08)', color: '#FF3B30', fontSize: 17, fontWeight: 600,
          fontFamily: 'inherit',
        }}>
          Вийти
        </button>
      </div>
    </div>
  )
}
