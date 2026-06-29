import { useParams, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { MOCK_PROVIDERS } from '../lib/mockData'

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24"
          fill={i <= full ? '#FF9500' : (i === full + 1 && half ? 'url(#half)' : 'none')}
          stroke={i <= full || (i === full + 1 && half) ? '#FF9500' : '#D1D1D6'}
          strokeWidth="1.5">
          <defs>
            <linearGradient id="half"><stop offset="50%" stopColor="#FF9500" /><stop offset="50%" stopColor="transparent" /></linearGradient>
          </defs>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize: 16, fontWeight: 700, color: '#FF9500', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  )
}

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const provider = MOCK_PROVIDERS[id ?? '']

  if (!provider) return (
    <div>
      <NavBar title="Профіль" />
      <div style={{ textAlign: 'center', padding: 64, color: '#8E8E93' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Профіль не знайдено</div>
      </div>
    </div>
  )

  const memberYear = provider.member_since.split('-')[0]
  const memberMonth = new Date(`${provider.member_since}-01`).toLocaleDateString('uk-UA', { month: 'long' })

  return (
    <div style={{ paddingBottom: 32 }}>
      <NavBar title="Виконавець" />

      <div style={{ padding: '16px 16px 0' }}>

        {/* Hero card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,.08)', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg,#111 0%,#333 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            }}>
              {provider.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.3px', marginBottom: 4 }}>{provider.name}</div>
              <div style={{ fontSize: 14, color: '#8E8E93', marginBottom: 8 }}>
                📍 {provider.city} · з {memberMonth} {memberYear}
              </div>
              <StarRating rating={provider.rating} />
            </div>
            {provider.verified && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#007AFF',
                background: 'rgba(0,122,255,.1)', padding: '4px 10px',
                borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              }}>✓ Верифіковано</span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#F2F2F7', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { val: provider.jobs, label: 'Виконано' },
              { val: `${provider.response_rate}%`, label: 'Відповідей' },
              { val: `${provider.completed_on_time}%`, label: 'Вчасно' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.5px' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            Про себе
          </div>
          <p style={{ fontSize: 15, color: '#3C3C43', margin: 0, lineHeight: 1.6 }}>{provider.bio}</p>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            Навички
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {provider.skills.map(s => (
              <span key={s} style={{
                padding: '7px 14px', borderRadius: 99,
                background: '#fff', border: '1px solid #E5E5EA',
                color: '#111', fontSize: 13, fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0,0,0,.05)',
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        {provider.portfolio.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              Останні роботи
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {provider.portfolio.map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 14, padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{item.date}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111', flexShrink: 0 }}>{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,.08)', marginBottom: 12,
        }}>
          {provider.hourly_rate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '0.5px solid #F2F2F7' }}>
              <div style={{ fontSize: 15, color: '#8E8E93' }}>Ставка</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px' }}>€{provider.hourly_rate}<span style={{ fontSize: 14, fontWeight: 400, color: '#8E8E93' }}>/год</span></div>
            </div>
          )}
          <button onClick={() => navigate(`/app/chat/${id}`)} style={{
            width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#111', color: '#fff', fontSize: 17, fontWeight: 700,
            fontFamily: 'inherit', letterSpacing: '-.2px',
          }}>
            Написати повідомлення →
          </button>
        </div>

      </div>
    </div>
  )
}
