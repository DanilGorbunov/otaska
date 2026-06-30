import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const myEntries = useQuery(api.entries.listMine) ?? []
  const matchCounts = useQuery(api.entries.listMatchCounts) ?? {}
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const [search, setSearch] = useState('')
  const [publishingPending, setPublishingPending] = useState(false)

  // After registration: pending entries were saved to localStorage before signIn.
  // Now auth is ready — create them on first Dashboard mount.
  useEffect(() => {
    const raw = localStorage.getItem('otaska_pending_entries')
    if (!raw) return
    let pending: Array<{ title: string; description: string; intentType: string; entryType: string; category?: string; city?: string; budgetMin?: number; budgetMax?: number }>
    try { pending = JSON.parse(raw) } catch { localStorage.removeItem('otaska_pending_entries'); return }
    if (!pending.length) { localStorage.removeItem('otaska_pending_entries'); return }
    localStorage.removeItem('otaska_pending_entries')
    setPublishingPending(true)
    Promise.all(pending.map(e =>
      createAndPublish({
        title: e.title,
        description: e.description,
        intentType: e.intentType as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job',
        entryType: e.entryType as 'on_demand' | 'project' | 'material',
        category: e.category,
        city: e.city,
        budgetMin: e.budgetMin,
        budgetMax: e.budgetMax,
      }).catch(() => null)
    )).finally(() => setPublishingPending(false))
  }, [])

  const projects = myEntries.filter(e => e.entryType === 'project')
  const entries = myEntries.filter(e => e.entryType !== 'project' && !e.projectId)
  const active = entries.filter(e => ['open', 'matched', 'booked', 'in_progress'].includes(e.status ?? '')).length
  const done = entries.filter(e => e.status === 'done').length
  const filteredEntries = entries.filter(e => (e.title ?? '').toLowerCase().includes(search.toLowerCase()))
  const filteredProjects = projects.filter(e => (e.title ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ background: '#F5F4F1', minHeight: '100dvh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Publishing banner */}
      {publishingPending && (
        <div style={{ background: '#EF9F27', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1612' }}>Публікуємо твої записи…</span>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '24px 16px 12px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1612', letterSpacing: -0.5 }}>Мої записи</div>
        <div style={{ fontSize: 13, color: '#9A8060', marginTop: 2 }}>
          {active > 0 ? `${active} активних · ${done} виконано` : 'Немає активних записів'}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9A8060" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук у записах..."
            style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 14, color: '#1A1612', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Entries + Projects */}
      {myEntries.length === 0 && !publishingPending ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1612', marginBottom: 8 }}>Ще немає записів</div>
          <div style={{ fontSize: 14, color: '#9A8060', marginBottom: 24 }}>Натисни + щоб додати перший запис</div>
          <button onClick={() => navigate('/app/new', { state: { backgroundLocation: location } })}
            style={{ padding: '14px 28px', borderRadius: 14, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1A1612', fontFamily: 'system-ui' }}>
            Додати запис →
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredEntries.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Записи</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredEntries.map(e => {
                  const hasAi = e.aiMatchCount != null
                  const count = e.aiMatchCount ?? 0
                  const first = hasAi && e.aiMatchFirstId
                    ? { _id: e.aiMatchFirstId, title: e.aiMatchFirstTitle ?? '', city: e.aiMatchFirstCity }
                    : undefined
                  return (
                    <div key={e._id} onClick={() => navigate(`/app/entries/${e._id}`)}
                      style={{ background: '#fff', borderRadius: 16, border: hasAi && count > 0 ? '1.5px solid #EF9F27' : '1.5px solid #EDE8DF', cursor: 'pointer', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612', marginBottom: 2 }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: '#9A8060' }}>
                            {e.category}{e.city ? ` · ${e.city}` : ''}{e.budgetMin && e.budgetMax ? ` · €${e.budgetMin}–${e.budgetMax}` : ''}
                          </div>
                        </div>
                        {!hasAi
                          ? <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C0B49A', display: 'inline-block', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
                            </span>
                          : count > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                                {count} збіг{count === 1 ? '' : count < 5 ? 'и' : 'ів'}
                              </span>
                            : <span style={{ fontSize: 11, color: '#B4A898', flexShrink: 0 }}>0 збігів</span>
                        }
                      </div>
                      {first && (
                        <div onClick={ev => { ev.stopPropagation(); navigate(`/app/entries/${first._id}`) }}
                          style={{ borderTop: '1px solid #FDE68A', background: 'rgba(239,159,39,.06)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF9F27', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#5A4A2E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {first.title}
                          </span>
                          {first.city && <span style={{ fontSize: 11, color: '#9A8060', flexShrink: 0 }}>📍 {first.city}</span>}
                          <svg width="5" height="9" viewBox="0 0 7 13" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round"><path d="M1 1.5l5 5-5 5"/></svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Проєкти</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredProjects.map(e => {
                  const m = matchCounts[e._id] as { count: number; first?: { _id: string; title: string; city?: string } } | undefined
                  const count = m?.count ?? 0
                  return (
                    <div key={e._id} onClick={() => navigate(`/app/entries/${e._id}`)}
                      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #EDE8DF', cursor: 'pointer', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>📁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612' }}>{e.title}</div>
                        {e.city && <div style={{ fontSize: 12, color: '#9A8060', marginTop: 2 }}>{e.city}</div>}
                      </div>
                      {count > 0
                        ? <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                            {count} збіг{count === 1 ? '' : count < 5 ? 'и' : 'ів'}
                          </span>
                        : <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                            {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C0B49A', display: 'inline-block', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
                          </span>
                      }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } @keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}
