import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BellButton } from '../components/layout/NavBar'

const CATEGORIES = ['Всі', 'Електрика', 'Сантехніка', 'Ремонт', 'Фарбування', 'Плитка', 'Теслярство', 'Матеріали', 'Переїзд', 'Інше']

const INTENT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  seeking_service:  { label: 'Шукає виконавця', color: '#1D4ED8', bg: 'rgba(29,78,216,.1)' },
  offering_service: { label: 'Пропонує послугу', color: '#15803D', bg: 'rgba(21,128,61,.1)' },
  seeking_job:      { label: 'Шукає роботу',     color: '#7C3AED', bg: 'rgba(124,58,237,.1)' },
  seeking_material: { label: 'Шукає матеріали',  color: '#B45309', bg: 'rgba(180,83,9,.1)' },
}

export function Browse() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Всі')

  const allOpen = useQuery(api.entries.listOpen, {}) ?? null

  const entries = useMemo(() => {
    if (!allOpen) return null
    return allOpen.filter(e => {
      if (e.entryType === 'project') return false
      const matchCat = category === 'Всі' || e.category === category
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [allOpen, search, category])

  return (
    <div>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
      }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', position: 'relative' }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.3px' }}>Знайти</span>
          <div style={{ position: 'absolute', right: 8 }}><BellButton /></div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук..."
            style={{
              width: '100%', padding: '9px 12px 9px 30px', borderRadius: 10, border: 'none',
              fontSize: 15, color: '#000', outline: 'none',
              background: 'rgba(118,118,128,.12)', fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: category === cat ? '#000' : 'rgba(118,118,128,.12)',
              color: category === cat ? '#fff' : '#3C3C43',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              transition: 'all .15s',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {entries === null ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Нічого не знайдено</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(e => {
            const intent = INTENT_LABEL[e.intentType] ?? { label: e.intentType, color: '#666', bg: '#f0f0f0' }
            return (
              <div key={e._id} onClick={() => navigate(`/app/entries/${e._id}`)}
                style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, flex: 1, marginRight: 8, color: '#1A1612' }}>{e.title}</div>
                </div>
                {e.description && e.description !== e.title && (
                  <div style={{ fontSize: 13, color: '#5A4A2E', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {e.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: intent.bg, color: intent.color }}>
                    {intent.label}
                  </span>
                  {e.city && <span style={{ fontSize: 12, color: '#9A8060' }}>📍 {e.city}</span>}
                  {e.category && e.category !== 'Інше' && (
                    <span style={{ fontSize: 12, color: '#9A8060', background: 'rgba(154,128,96,.1)', padding: '2px 7px', borderRadius: 6 }}>{e.category}</span>
                  )}
                  {e.budgetMin != null && e.budgetMax != null && e.budgetMax > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27' }}>€{e.budgetMin}–{e.budgetMax}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
