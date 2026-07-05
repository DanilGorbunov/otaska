import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BellButton } from '../components/layout/NavBar'

const CATEGORIES = ['Всі', 'Електрика', 'Сантехніка', 'Ремонт', 'Фарбування', 'Плитка', 'Теслярство', 'Матеріали', 'Переїзд', 'Інше']

const INTENT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  seeking_service:  { label: 'Шукає виконавця', color: '#5A3E22', bg: 'rgba(239,159,39,.14)' },
  offering_service: { label: 'Пропонує послугу', color: '#2D5A27', bg: 'rgba(34,197,94,.13)' },
  seeking_job:      { label: 'Шукає роботу',     color: '#4A3060', bg: 'rgba(139,92,246,.12)' },
  seeking_material: { label: 'Шукає матеріали',  color: '#5A4A2E', bg: 'rgba(154,128,96,.15)' },
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
    <div style={{ background: '#F2F2F7', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(154,128,96,.2)',
      }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', position: 'relative' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1612', letterSpacing: '-.4px' }}>Знайти</span>
          <div style={{ position: 'absolute', right: 12 }}><BellButton /></div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9A8060" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук..."
            style={{
              width: '100%', padding: '11px 14px 11px 34px', borderRadius: 14, border: '1.5px solid #EDE8DF',
              fontSize: 15, color: '#1A1612', outline: 'none',
              background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0,0,0,.05)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1A1612' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: category === cat ? '#1A1612' : '#fff',
              color: category === cat ? '#fff' : '#9A8060',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              boxShadow: category === cat ? '0 2px 8px rgba(0,0,0,.2)' : '0 1px 4px rgba(0,0,0,.07)',
              transition: 'all .15s',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {entries === null ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #EF9F27', borderTopColor: 'transparent', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 32px', color: '#9A8060' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}>Нічого не знайдено</div>
          <div style={{ fontSize: 14 }}>Спробуйте змінити пошук або категорію</div>
        </div>
      ) : (
        <div style={{ padding: '4px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(e => {
            const intent = INTENT_LABEL[e.intentType] ?? { label: e.intentType, color: '#9A8060', bg: 'rgba(154,128,96,.12)' }
            return (
              <div key={e._id} onClick={() => navigate(`/app/entries/${e._id}`)}
                style={{
                  background: '#fff', borderRadius: 18, padding: '16px',
                  cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.06)',
                  border: '1.5px solid #EDE8DF',
                  transition: 'transform .12s, box-shadow .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.06)' }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1612', marginBottom: 6, letterSpacing: '-.2px' }}>{e.title}</div>
                {e.description && e.description !== e.title && (
                  <div style={{ fontSize: 13, color: '#5A4A2E', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {e.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: intent.bg, color: intent.color }}>
                    {intent.label}
                  </span>
                  {e.city && <span style={{ fontSize: 12, color: '#9A8060' }}>📍 {e.city}</span>}
                  {e.category && e.category !== 'Інше' && (
                    <span style={{ fontSize: 12, color: '#9A8060', background: '#F5F3EF', padding: '3px 8px', borderRadius: 99, fontWeight: 500 }}>{e.category}</span>
                  )}
                  {e.budgetMin != null && e.budgetMax != null && e.budgetMax > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#EF9F27', marginLeft: 'auto' }}>€{e.budgetMin}–{e.budgetMax}</span>
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
