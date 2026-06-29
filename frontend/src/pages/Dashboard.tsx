import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntryCard } from '../components/entries/EntryCard'
import { MOCK_CONVERSATIONS } from '../lib/mockData'
import { useAppStore } from '../store/appStore'

export function Dashboard() {
  const navigate = useNavigate()
  const { entries, projects, loading, deleteEntry } = useAppStore()
  const [tab, setTab] = useState<'entries' | 'browse'>('entries')
  const [search, setSearch] = useState('')
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)

  const active = entries.filter(e => ['open', 'matched', 'booked', 'in_progress'].includes(e.status)).length
  const done = entries.filter(e => e.status === 'done').length
  const filtered = entries.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

  function onTouchStart(id: string, x: number) {
    touchStartX.current = x
    if (swipedId && swipedId !== id) setSwipedId(null)
  }
  function onTouchEnd(id: string, x: number) {
    if (touchStartX.current - x > 50) setSwipedId(id)
    else if (x - touchStartX.current > 20) setSwipedId(null)
  }

  return (
    <div onClick={() => swipedId && setSwipedId(null)}>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
      }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', position: 'relative' }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.3px' }}>OTaska</span>
          <button onClick={() => navigate('/app/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'absolute', right: 12, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ position: 'relative' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0) > 0 && (
                <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#FF3B30', border: '1.5px solid rgba(242,242,247,.94)' }} />
              )}
            </div>
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '0.5px solid rgba(60,60,67,.18)' }}>
          {[
            { val: active, label: 'Активні' },
            { val: done, label: 'Виконано' },
            { val: projects.length, label: 'Проєкти' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '8px 12px', textAlign: 'center', borderRight: i < 2 ? '0.5px solid rgba(60,60,67,.18)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#000', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.3px', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Segment control */}
        <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(118,118,128,.12)', borderRadius: 9, marginBottom: 12 }}>
          {(['entries', 'browse'] as const).map(t => (
            <div key={t} onClick={() => t === 'browse' ? navigate('/app/browse') : setTab(t)}
              style={{
                flex: 1, textAlign: 'center', padding: 7, borderRadius: 8, cursor: 'pointer',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#000' : '#8E8E93',
                fontSize: 13, fontWeight: 600,
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
                transition: 'all .15s',
              }}>
              {t === 'entries' ? 'Мої записи' : 'Знайти'}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук у записах..."
            style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: 10, border: 'none', fontSize: 15, color: '#000', outline: 'none', background: 'rgba(118,118,128,.12)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
      ) : (
        <>
          {/* Entries list */}
          {filtered.length > 0 ? (
            <div style={{ margin: '0 16px 16px' }}>
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(0,0,0,.06)' }}>
                {filtered.map((e, i) => (
                  <div key={e.id} style={{ position: 'relative', overflow: 'hidden', borderBottom: i < filtered.length - 1 ? '0.5px solid #E5E5EA' : 'none' }}>
                    {/* Entry card — slides left when swiped */}
                    <div
                      style={{ transform: swipedId === e.id ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform .25s', background: '#fff' }}
                      onTouchStart={ev => onTouchStart(e.id, ev.touches[0].clientX)}
                      onTouchEnd={ev => onTouchEnd(e.id, ev.changedTouches[0].clientX)}
                    >
                      <EntryCard entry={e} />
                    </div>
                    {/* Delete button revealed on swipe */}
                    <button
                      onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id) }}
                      style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
                        background: '#FF3B30', border: 'none', cursor: 'pointer',
                        color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        opacity: swipedId === e.id ? 1 : 0,
                        transition: 'opacity .2s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                      Видалити
                    </button>
                    {/* Desktop delete button (⋮ menu) */}
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setSwipedId(swipedId === e.id ? null : e.id) }}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#C7C7CC', fontSize: 20, lineHeight: 1, padding: '0 4px',
                        display: swipedId === e.id ? 'none' : 'flex', alignItems: 'center',
                        WebkitTapHighlightColor: 'transparent',
                        zIndex: 2,
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 17, fontWeight: 500, color: '#000', marginBottom: 8 }}>Ще немає записів</div>
              <div style={{ fontSize: 15 }}>Натисни + щоб додати перший запис</div>
            </div>
          )}

          {/* Projects section */}
          {projects.length > 0 && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                Проєкти
              </div>
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(0,0,0,.06)' }}>
                {projects.map(p => {
                  const doneTasks = p.tasks.filter(t => t.done).length
                  const pct = p.tasks.length ? Math.round(doneTasks / p.tasks.length * 100) : 0
                  return (
                    <div key={p.id} onClick={() => navigate(`/app/projects/${p.id}`)}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #E5E5EA', cursor: 'pointer' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#F9F9F9')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontSize: 20, marginRight: 10 }}>📁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>{p.title}</div>
                        <div style={{ height: 4, borderRadius: 99, background: '#E5E5EA', marginTop: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: '#111111', width: `${pct}%`, transition: 'width .4s' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#8E8E93', marginLeft: 12 }}>{doneTasks}/{p.tasks.length}</div>
                      <svg width="7" height="13" viewBox="0 0 7 13" fill="none" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" style={{ marginLeft: 4 }}>
                        <path d="M1 1.5l5 5-5 5" />
                      </svg>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
