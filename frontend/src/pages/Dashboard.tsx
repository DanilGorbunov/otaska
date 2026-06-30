import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  type GoalItem = { id: string | null; aiResult: { emoji: string; category: string; title: string; min: number; max: number; time: string }; task: string }
  type NewReg = { goals: GoalItem[]; city: string; name: string }
  const newRegistration = (location.state as { newRegistration?: NewReg } | null)?.newRegistration ?? null
  // legacy compat
  const legacyEntry = (location.state as { newEntry?: { id: string; task: string; aiResult: { emoji: string; category: string; min: number; max: number; time: string } | null; city: string } } | null)?.newEntry ?? null
  const primaryCategory = newRegistration?.goals[0]?.aiResult?.category ?? legacyEntry?.aiResult?.category
  const myEntries = useQuery(api.entries.listMine) ?? []
  // for main dashboard: use first real entry's category for proposals
  const dashboardCategory = primaryCategory ?? myEntries[0]?.category
  const similar = useQuery(api.entries.listOpen, dashboardCategory ? { category: dashboardCategory } : 'skip')
  const [search, setSearch] = useState('')

  const active = myEntries.filter(e => ['open', 'matched', 'booked', 'in_progress'].includes(e.status ?? '')).length
  const done = myEntries.filter(e => e.status === 'done').length
  const filtered = myEntries.filter(e => (e.title ?? '').toLowerCase().includes(search.toLowerCase()))
  const myIds = myEntries.map(e => e._id)

  return (
    <div onClick={() => swipedId && setSwipedId(null)}>

      {/* ── Welcome screen after first registration ── */}
      {(newRegistration || legacyEntry) && (() => {
        const reg = newRegistration
        const goals: GoalItem[] = reg?.goals ?? (legacyEntry ? [{ id: legacyEntry.id, task: legacyEntry.task, aiResult: legacyEntry.aiResult ? { ...legacyEntry.aiResult, title: legacyEntry.task } : { emoji: '📝', category: '', title: legacyEntry.task, min: 0, max: 0, time: '' } }] : [])
        const city = reg?.city ?? legacyEntry?.city ?? ''
        const name = reg?.name ?? ''
        const allIds = goals.map(g => g.id).filter(Boolean)

        return (
          <div style={{ background: '#F5F4F1', minHeight: '100dvh', padding: '24px 16px 100px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#9A8060', marginBottom: 4 }}>Привіт{name ? `, ${name}` : ''} 👋</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1612', margin: '0 0 6px', letterSpacing: -0.5 }}>
                {goals.length > 1 ? 'Твої цілі опубліковані' : 'Твій запис опублікований'}
              </h1>
              <p style={{ fontSize: 14, color: '#9A8060', margin: 0 }}>Шукаємо відповідні пропозиції…</p>
            </div>

            {/* Goals todo list */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {goals.length > 1 ? 'Твої цілі' : 'Твоя ціль'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goals.map((g, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '2px solid #EF9F27', boxShadow: '0 4px 16px rgba(239,159,39,.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{g.aiResult.emoji}</span>
                      <div style={{ flex: 1 }}>
                        {goals.length > 1 && <div style={{ fontSize: 10, fontWeight: 700, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 1 }}>Ціль {i + 1}</div>}
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612' }}>{g.aiResult.title}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
                        <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Активно</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#9A8060' }}>{g.aiResult.category} · {city} · {g.aiResult.time}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#EF9F27' }}>€{g.aiResult.min}–{g.aiResult.max}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar proposals */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Пропозиції по темі
              </div>
              {similar === undefined ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#B4A898', fontSize: 14 }}>Шукаємо…</div>
              ) : similar.filter(e => !allIds.includes(e._id)).slice(0, 5).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {similar.filter(e => !allIds.includes(e._id)).slice(0, 5).map(s => (
                    <div key={s._id} onClick={() => navigate(`/app/entries/${s._id}`)}
                      style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #EDE8DF', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1612', marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#9A8060' }}>{s.city ?? city}</div>
                      </div>
                      {s.budgetMin && s.budgetMax
                        ? <div style={{ fontSize: 13, fontWeight: 700, color: '#EF9F27', whiteSpace: 'nowrap' }}>€{s.budgetMin}–{s.budgetMax}</div>
                        : <div style={{ fontSize: 12, color: '#B4A898' }}>Договірна</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', border: '1.5px solid #EDE8DF', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612', marginBottom: 4 }}>Ти серед перших</div>
                  <div style={{ fontSize: 13, color: '#9A8060' }}>Виконавці отримають сповіщення</div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/app', { replace: true, state: null })}
              style={{ width: '100%', padding: 16, borderRadius: 14, background: '#1A1612', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'system-ui' }}
            >
              Перейти до кабінету →
            </button>
          </div>
        )
      })()}

      {/* ── Main dashboard ── */}
      {!newRegistration && !legacyEntry && (
        <div style={{ background: '#F5F4F1', minHeight: '100dvh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
          {/* Header */}
          <div style={{ padding: '24px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1612', letterSpacing: -0.5 }}>Мої записи</div>
              <div style={{ fontSize: 13, color: '#9A8060', marginTop: 2 }}>
                {active > 0 ? `${active} активних · ${done} виконано` : 'Немає активних записів'}
              </div>
            </div>
            <button
              onClick={() => navigate('/app/new', { state: { backgroundLocation: location } })}
              style={{ width: 44, height: 44, borderRadius: 22, background: '#EF9F27', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,159,39,.35)', flexShrink: 0 }}
            >
              <span style={{ fontSize: 24, color: '#1A1612', lineHeight: 1 }}>+</span>
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '0 16px 16px', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 26, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9A8060" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Пошук у записах..."
              style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 14, color: '#1A1612', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Entries */}
          {myEntries === undefined ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9A8060', fontSize: 14 }}>Завантаження…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1612', marginBottom: 8 }}>Ще немає записів</div>
              <div style={{ fontSize: 14, color: '#9A8060', marginBottom: 24 }}>Натисни + щоб додати перший запис</div>
              <button onClick={() => navigate('/')}
                onClick={() => navigate('/app/new', { state: { backgroundLocation: location } })}
              style={{ padding: '14px 28px', borderRadius: 14, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1A1612', fontFamily: 'system-ui' }}>
                Додати запис →
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(e => (
                <div key={e._id} onClick={() => navigate(`/app/entries/${e._id}`)}
                  style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #EDE8DF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612', marginBottom: 2 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: '#9A8060' }}>
                      {e.category} {e.city ? `· ${e.city}` : ''} {e.budgetMin && e.budgetMax ? `· €${e.budgetMin}–${e.budgetMax}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.status === 'open' ? '#22C55E' : e.status === 'done' ? '#9A8060' : '#EF9F27' }} />
                    <span style={{ fontSize: 12, color: '#9A8060', fontWeight: 600 }}>
                      {e.status === 'open' ? 'Активно' : e.status === 'done' ? 'Виконано' : e.status ?? 'Відкрито'}
                    </span>
                    <svg width="6" height="11" viewBox="0 0 7 13" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round"><path d="M1 1.5l5 5-5 5" /></svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Similar proposals for main dashboard */}
          {(() => {
            const proposals = (similar ?? []).filter(e => !myIds.includes(e._id)).slice(0, 4)
            if (!dashboardCategory || proposals.length === 0) return null
            return (
              <div style={{ padding: '20px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF9F27', animation: 'pulse 2s ease-in-out infinite' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Збіги · {dashboardCategory}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proposals.map(s => (
                    <div key={s._id} onClick={() => navigate(`/app/entries/${s._id}`)}
                      style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #EDE8DF', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1612', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#9A8060' }}>{s.city ?? ''}</div>
                      </div>
                      {s.budgetMin && s.budgetMax
                        ? <div style={{ fontSize: 13, fontWeight: 700, color: '#EF9F27', whiteSpace: 'nowrap', marginLeft: 10 }}>€{s.budgetMin}–{s.budgetMax}</div>
                        : <div style={{ fontSize: 12, color: '#B4A898', marginLeft: 10 }}>Договірна</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
