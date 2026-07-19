import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? 'var(--accent)' : 'none'}
          stroke={i <= Math.round(rating) ? 'var(--accent)' : 'var(--text-dim)'}
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
      <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!data || !user) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Профіль не знайдено</div>
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
    <div style={{ background: 'var(--bg-page)', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* ── Cover + back ── */}
      <div style={{ position: 'relative', height: 200, background: coverUrl ? undefined : 'linear-gradient(135deg, var(--text-primary) 0%, #3D2E1E 60%, var(--accent) 100%)', overflow: 'hidden' }}>
        {coverUrl
          ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
              <div style={{ position: 'absolute', bottom: -60, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(239,159,39,.12)' }} />
            </>
        }

        {/* Back button — portaled to body so it stays truly viewport-fixed (an ancestor's
            willChange:transform would otherwise turn position:fixed into position:absolute) */}
        {createPortal((
          <button onClick={() => navigate(-1)} style={{
            position: 'fixed', top: 16, left: 16, zIndex: 60,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ), document.body)}

        {/* Role badge top-right */}
        {(profile?.skills?.length ?? 0) > 0 && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          }}>
            {profile?.verified ? '✓ ' : ''}Майстер
          </div>
        )}
      </div>

      {/* ── Avatar overlapping cover ── */}
      <div style={{ position: 'relative', padding: '0 20px', marginTop: -48 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', flexShrink: 0, border: '3px solid var(--bg-page)', boxShadow: '0 4px 20px rgba(0,0,0,.2)', overflow: 'hidden', background: 'linear-gradient(135deg,var(--text-primary) 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ paddingBottom: 8, flex: 1 }}>
            {rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <StarRow rating={rating} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{rating.toFixed(1)}</span>
              </div>
            )}
            {profile?.city && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {profile.city}</div>
            )}
          </div>
        </div>

        {/* Name + bio + stats in one card */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Left: name + bio */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.4px' }}>{name}</div>
                {profile?.verified && (
                  <span title="Верифікований" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>✓</span>
                )}
              </div>
              {profile?.bio ? (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, margin: '0 0 8px' }}>{profile.bio}</p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', margin: '0 0 8px' }}>Немає опису</p>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile?.city && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {profile.city}</span>}
                {profile?.category && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🔧 {profile.category}</span>}
                {profile?.availability && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🕐 {profile.availability}</span>}
              </div>
            </div>

            {/* Right: stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
              {[
                { val: rating > 0 ? rating.toFixed(1) : '—', label: 'Рейтинг' },
                { val: String(jobs), label: 'Замовлень' },
                { val: profile?.priceFrom && profile?.priceTo ? `€${profile.priceFrom}–${profile.priceTo}` : profile?.hourlyRate ? `€${profile.hourlyRate}/год` : '—', label: 'Ціна' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: '#fff', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Portfolio grid — omitted entirely when empty, no fake placeholder photos ── */}
        {portfolioUrls.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Портфоліо</div>
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
        </div>
        )}

        {/* ── Reviews ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Відгуки {reviews.length > 0 && `(${reviews.length})`}
          </div>

          {reviews.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Поки немає відгуків</div>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r._id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {r.reviewerName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.reviewerName}</div>
                    <StarRow rating={r.rating} size={12} />
                  </div>
                </div>
                {r.entryTitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>«{r.entryTitle}»</div>}
                {r.tags && r.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: r.comment ? 6 : 0 }}>
                    {r.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-on-accent)', background: 'var(--bg-accent-tint)', padding: '3px 9px', borderRadius: 99 }}>{tag}</span>
                    ))}
                  </div>
                )}
                {r.comment && <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.55 }}>{r.comment}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-page-blur)', backdropFilter: 'blur(16px)',
        borderTop: '0.5px solid rgba(60,60,67,.12)',
        display: 'flex', gap: 10, zIndex: 50,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button onClick={() => navigate(`/app/chat/${id}`)}
          style={{
            flex: 1, padding: '14px', borderRadius: 14,
            border: '1.5px solid var(--border)', background: '#fff',
            cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit',
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
            border: 'none', background: 'var(--text-primary)',
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
