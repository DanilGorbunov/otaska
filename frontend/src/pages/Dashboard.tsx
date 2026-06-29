import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { entriesApi, projectsApi } from '../lib/api'
import type { Entry, Project } from '../types'
import { EntryCard } from '../components/entries/EntryCard'
import { Logo } from '../components/layout/Logo'

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'entries' | 'browse'>('entries')
  const [entries, setEntries] = useState<Entry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      entriesApi.list().then(r => setEntries(r.data)),
      projectsApi.list().then(r => setProjects(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const active = entries.filter(e => ['open', 'matched', 'booked', 'in_progress'].includes(e.status)).length
  const done = entries.filter(e => e.status === 'done').length
  const filtered = entries.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
      }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <Logo />
          <button onClick={() => navigate('/app/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
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
            <div key={i} style={{
              padding: '8px 12px', textAlign: 'center',
              borderRight: i < 2 ? '0.5px solid rgba(60,60,67,.18)' : 'none',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#000', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.3px', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Large title */}
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.5px', margin: '0 0 12px' }}>Мої записи</h1>

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
            style={{
              width: '100%', padding: '9px 12px 9px 30px', borderRadius: 10, border: 'none',
              fontSize: 15, color: '#000', outline: 'none',
              background: 'rgba(118,118,128,.12)', fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
      ) : (
        <>
          {/* Entries list */}
          {filtered.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(0,0,0,.06)', margin: '0 16px 16px' }}>
              {filtered.map(e => <EntryCard key={e.id} entry={e} />)}
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
                  const done = p.tasks.filter(t => t.done).length
                  const pct = p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0
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
                      <div style={{ fontSize: 12, color: '#8E8E93', marginLeft: 12 }}>{done}/{p.tasks.length}</div>
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
