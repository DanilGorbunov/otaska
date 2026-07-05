import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// Placeholder tiles shown when no portfolio photos yet
const PLACEHOLDERS = ['#E8DDD0', '#D9EAD3', '#CFE2F3', '#EDE8DF', '#FAE3C6', '#E6CECE']

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#EF9F27' : 'none'}
          stroke={i <= Math.round(rating) ? '#EF9F27' : '#C0B49A'}
          strokeWidth="1.8" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}


export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const data = useQuery(api.storage.getProviderProfileFull, id ? { userId: id as Id<'users'> } : 'skip')
  const reviews = useQuery(api.reviews.listForProvider, id ? { providerId: id as Id<'users'> } : 'skip') ?? []

  const user = data?.user
  const avatarUrl = data?.avatarUrl
  const coverUrl = data?.coverUrl
  const portfolioUrls = data?.portfolioUrls ?? []

  if (data === undefined) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #EF9F27', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!data || !user) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#9A8060' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#1A1612' }}>Профіль не знайдено</div>
      </div>
    )
  }

  const name = user.name ?? user.email?.split('@')[0] ?? 'Користувач'
  const profile = data.profile
  const rating = profile?.rating ?? 0
  const jobs = profile?.jobsCompleted ?? 0
  const skills = profile?.skills ?? []
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* ── Cover + back ── */}
      <div style={{ position: 'relative', height: 200, background: coverUrl ? undefined : 'linear-gradient(135deg, #1A1612 0%, #3D2E1E 60%, #EF9F27 100%)', overflow: 'hidden' }}>
        {coverUrl
          ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
              <div style={{ position: 'absolute', bottom: -60, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(239,159,39,.12)' }} />
            </>
        }

        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Verified badge top-right */}
        {profile?.isProvider && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, color: '#EF9F27',
          }}>
            ✓ Майстер
          </div>
        )}
      </div>

      {/* ── Avatar overlapping cover ── */}
      <div style={{ position: 'relative', padding: '0 20px', marginTop: -48 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', flexShrink: 0, border: '3px solid #F2F2F7', boxShadow: '0 4px 20px rgba(0,0,0,.2)', overflow: 'hidden', background: 'linear-gradient(135deg,#1A1612 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#EF9F27' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ paddingBottom: 8, flex: 1 }}>
            {rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <StarRow rating={rating} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EF9F27' }}>{rating.toFixed(1)}</span>
              </div>
            )}
            {profile?.city && (
              <div style={{ fontSize: 13, color: '#9A8060' }}>📍 {profile.city}</div>
            )}
          </div>
        </div>

        {/* Name + bio */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '18px 18px 16px', marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1612', letterSpacing: '-.4px', marginBottom: 4 }}>{name}</div>

          {profile?.bio ? (
            <p style={{ fontSize: 14, color: '#5A4A2E', lineHeight: 1.65, margin: '0 0 12px' }}>{profile.bio}</p>
          ) : (
            <p style={{ fontSize: 14, color: '#C0B49A', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>Немає опису</p>
          )}

          {profile?.availability && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5F3EF', borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ fontSize: 12 }}>🕐</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5A4A2E' }}>{profile.availability}</span>
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { val: rating > 0 ? rating.toFixed(1) : '—', label: 'Рейтинг', icon: '⭐' },
            { val: jobs > 0 ? String(jobs) : '0', label: 'Замовлень', icon: '✅' },
            { val: profile?.hourlyRate ? `€${profile.hourlyRate}` : '—', label: 'за годину', icon: '💶' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '14px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1612' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#9A8060', fontWeight: 500, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: '#fff', color: '#1A1612', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Portfolio grid ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Портфоліо</div>
          {portfolioUrls.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, borderRadius: 16, overflow: 'hidden' }}>
              {PLACEHOLDERS.map((color, i) => (
                <div key={i} style={{ aspectRatio: '1', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(0,0,0,.2)' }}>📷</div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, borderRadius: 16, overflow: 'hidden' }}>
              {portfolioUrls.map(item => (
                <div key={item.storageId} style={{ position: 'relative', aspectRatio: '1' }}>
                  <img src={item.url ?? ''} alt={item.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {item.caption && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.7))', padding: '12px 6px 5px', fontSize: 10, color: '#fff', lineHeight: 1.3 }}>
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Reviews ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Відгуки {reviews.length > 0 && `(${reviews.length})`}
          </div>

          {reviews.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 14, color: '#9A8060' }}>Поки немає відгуків</div>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r._id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#5A4A2E', flexShrink: 0 }}>
                    {r.reviewerName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1612' }}>{r.reviewerName}</div>
                    <StarRow rating={r.rating} size={12} />
                  </div>
                </div>
                {r.entryTitle && <div style={{ fontSize: 12, color: '#9A8060', marginBottom: 4 }}>«{r.entryTitle}»</div>}
                {r.comment && <div style={{ fontSize: 14, color: '#3C3226', lineHeight: 1.55 }}>{r.comment}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(242,242,247,.95)', backdropFilter: 'blur(16px)',
        borderTop: '0.5px solid rgba(60,60,67,.12)',
        display: 'flex', gap: 10, zIndex: 50,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button onClick={() => navigate(`/app/chat/${id}`)}
          style={{
            flex: 1, padding: '14px', borderRadius: 14,
            border: '1.5px solid #EDE8DF', background: '#fff',
            cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#1A1612', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Написати
        </button>
        <button onClick={() => navigate('/app/new')}
          style={{
            flex: 2, padding: '14px', borderRadius: 14,
            border: 'none', background: '#1A1612',
            cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2" />
          </svg>
          Замовити
        </button>
      </div>
    </div>
  )
}
