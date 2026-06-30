import { useParams, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useQuery(api.users.getUser, id ? { userId: id as Id<'users'> } : 'skip')

  if (user === undefined) {
    return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
  }
  if (!user) {
    return (
      <div>
        <NavBar title="Профіль" />
        <div style={{ textAlign: 'center', padding: 64, color: '#8E8E93' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Профіль не знайдено</div>
        </div>
      </div>
    )
  }

  const name = user.name ?? user.email?.split('@')[0] ?? 'Користувач'
  const profile = user.profile
  const rating = profile?.rating ?? 0
  const jobs = profile?.jobsCompleted ?? 0
  const skills = profile?.skills ?? []

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title="Профіль" />

      <div style={{ padding: '16px 16px 0' }}>
        {/* Avatar + name */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 20px 20px', boxShadow: '0 1px 8px rgba(0,0,0,.07)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#111 0%,#333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {name[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1612', letterSpacing: '-.3px' }}>{name}</div>
              {profile?.city && <div style={{ fontSize: 14, color: '#9A8060', marginTop: 2 }}>📍 {profile.city}</div>}
              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  {'⭐'.repeat(Math.round(rating))}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FF9500' }}>{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {profile?.bio && (
            <p style={{ fontSize: 14, color: '#5A4A2E', lineHeight: 1.6, margin: 0, borderTop: '1px solid #EDE8DF', paddingTop: 14 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        {(rating > 0 || jobs > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { val: rating > 0 ? rating.toFixed(1) : '—', label: 'Рейтинг', color: '#FF9500' },
              { val: jobs > 0 ? jobs : '—', label: 'Виконано', color: '#34C759' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 8px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: 'rgba(0,0,0,.06)', color: '#111', fontSize: 13, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Hourly rate */}
        {profile?.hourlyRate && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <span style={{ fontSize: 15, color: '#1A1612' }}>Ставка</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#EF9F27' }}>€{profile.hourlyRate}/год</span>
          </div>
        )}

        {/* Write button */}
        <button onClick={() => navigate(`/app/chat/${id}`)}
          style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#1A1612', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'inherit', marginTop: 4 }}>
          ✉️ Написати
        </button>
      </div>
    </div>
  )
}
