import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Entry } from '../types'
import { IntentBadge } from '../components/ui/IntentBadge'
import { MOCK_BROWSE_ENTRIES } from '../lib/mockData'
import { BellButton } from '../components/layout/NavBar'

const categories = ['Всі', 'Електрика', 'Сантехніка', 'Ремонт', 'Фарбування', 'Плитка', 'Теслярство', 'Матеріали', 'Переїзд']

const CAT_MAP: Record<string, string> = {
  'Електрика': 'electric', 'Сантехніка': 'plumbing', 'Ремонт': 'renovation',
  'Фарбування': 'painting', 'Плитка': 'tiling', 'Теслярство': 'carpentry',
  'Матеріали': 'materials', 'Переїзд': 'moving',
}

export function Browse() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Всі')
  const loading = false

  const entries = useMemo<Entry[]>(() => {
    return MOCK_BROWSE_ENTRIES.filter(e => {
      const matchCat = category === 'Всі' || e.category === CAT_MAP[category]
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [search, category])

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
          {categories.map(cat => (
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Нічого не знайдено</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(entry => (
            <div key={entry.id} onClick={() => navigate(`/app/entries/${entry.id}`)}
              style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                transition: 'transform .1s',
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.005)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 500, flex: 1, marginRight: 8 }}>{entry.title}</div>
                {entry.ai_urgency === 'high' && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,59,48,.1)', color: '#FF3B30', flexShrink: 0 }}>
                    Терміново
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#8E8E93', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {entry.city && <span>📍 {entry.city}</span>}
                {(entry.budget_min || entry.budget_max) && (
                  <span style={{ fontWeight: 500, color: '#333333' }}>
                    €{entry.budget_min ?? '?'}–{entry.budget_max ?? '?'}
                  </span>
                )}
                {entry.category && <span>{entry.category}</span>}
              </div>
              <div style={{ marginTop: 8 }}>
                <IntentBadge type={entry.intent_type} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
