import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const myEntries = useQuery(api.entries.listMine) ?? []
  const matchCounts = useQuery(api.entries.listMatchCounts) ?? {}
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const updateEntry = useMutation(api.entries.update)
  const removeEntry = useMutation(api.entries.remove)
  const [search, setSearch] = useState('')
  const [publishingPending, setPublishingPending] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<Id<'entries'>>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

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

  const toggleSelected = (id: Id<'entries'>) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkDone = async () => {
    setBulkBusy(true)
    try {
      await Promise.all([...selectedIds].map(id => updateEntry({ id, status: 'done' })))
      exitSelectMode()
    } finally {
      setBulkBusy(false)
    }
  }

  const allSelected = filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.has(e._id))

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredEntries.map(e => e._id)))
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Видалити ${selectedIds.size} запис(ів)? Дію не можна скасувати.`)) return
    setBulkBusy(true)
    try {
      await Promise.all([...selectedIds].map(id => removeEntry({ id })))
      exitSelectMode()
    } finally {
      setBulkBusy(false)
    }
  }

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
      <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1612', letterSpacing: -0.5 }}>Мої записи</div>
          <div style={{ fontSize: 13, color: '#9A8060', marginTop: 2 }}>
            {active > 0 ? `${active} активних · ${done} виконано` : 'Немає активних записів'}
          </div>
        </div>
        {filteredEntries.length > 0 && (
          <button onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            style={{ marginTop: 4, padding: '6px 12px', borderRadius: 10, border: '1.5px solid #EDE8DF', background: selectMode ? '#1A1612' : '#fff', color: selectMode ? '#fff' : '#1A1612', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            {selectMode ? 'Скасувати' : 'Вибрати'}
          </button>
        )}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1 }}>Записи</div>
                {selectMode && (
                  <button onClick={toggleSelectAll}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 700, color: '#EF9F27', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {allSelected ? 'Скасувати всі' : 'Вибрати всі'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredEntries.map(e => {
                  const hasAi = e.aiMatchCount != null
                  const count = e.aiMatchCount ?? 0
                  const first = hasAi && e.aiMatchFirstId
                    ? { _id: e.aiMatchFirstId, title: e.aiMatchFirstTitle ?? '', city: e.aiMatchFirstCity }
                    : undefined
                  const selected = selectedIds.has(e._id)
                  return (
                    <div key={e._id}
                      onClick={() => selectMode ? toggleSelected(e._id) : navigate(`/app/entries/${e._id}`)}
                      style={{ background: '#fff', borderRadius: 16, border: selected ? '1.5px solid #EF9F27' : '1.5px solid #EDE8DF', cursor: 'pointer', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        {selectMode && (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            border: selected ? 'none' : '1.5px solid #C0B49A',
                            background: selected ? '#EF9F27' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selected && (
                              <svg width="11" height="9" viewBox="0 0 12 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 5l3.5 3.5L11 1" />
                              </svg>
                            )}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612', marginBottom: 2 }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: '#9A8060' }}>
                            {e.category}{e.city ? ` · ${e.city}` : ''}{e.budgetMin && e.budgetMax ? ` · €${e.budgetMin}–${e.budgetMax}` : ''}
                          </div>
                        </div>
                        {selectMode ? null : !hasAi
                          ? <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C0B49A', display: 'inline-block', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
                            </span>
                          : count > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                                {count}
                              </span>
                            : <span style={{ fontSize: 11, color: '#B4A898', flexShrink: 0 }}>0 збігів</span>
                        }
                      </div>
                      {first && (
                        <div onClick={ev => { ev.stopPropagation(); selectMode ? toggleSelected(e._id) : navigate(`/app/entries/${first._id}`) }}
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
                            {count}
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

      {/* Bulk actions bar */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, zIndex: 51, boxSizing: 'border-box',
          background: '#1A1612', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{selectedIds.size} обрано</span>
          <button disabled={bulkBusy} onClick={handleBulkDone}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#0A2313', fontSize: 13, fontWeight: 700, cursor: bulkBusy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: bulkBusy ? 0.6 : 1 }}>
            ✓ Виконано
          </button>
          <button disabled={bulkBusy} onClick={handleBulkDelete}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: bulkBusy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: bulkBusy ? 0.6 : 1 }}>
            🗑 Видалити
          </button>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } @keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}
