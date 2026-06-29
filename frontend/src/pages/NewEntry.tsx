import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { entriesApi, aiApi } from '../lib/api'
import type { Entry } from '../types'

const DEBOUNCE_MS = 900

interface LiveMatchResult {
  ai: {
    intent_type: string
    category: string
    entry_type: string
    urgency: string
    title: string
    skills: string[]
  }
  entry_matches: Entry[]
  provider_matches: Array<{
    id: string
    name: string
    city?: string
    rating: number
    jobs_completed: number
    skills: string[]
    hourly_rate?: number
  }>
  total: number
}

const intentLabel: Record<string, string> = {
  seeking_service:  'шукаю виконавця',
  offering_service: 'пропоную послугу',
  seeking_material: 'шукаю матеріали',
  seeking_job:      'шукаю роботу',
}

const urgencyMap: Record<string, string> = {
  high: '🔴 Терміново', medium: '🟡 Звичайно', low: '🟢 Не спішно',
}

export function NewEntry() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [liveResult, setLiveResult] = useState<LiveMatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'write' | 'confirm'>('write')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (text.length < 8) { setLiveResult(null); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await aiApi.liveMatch(text, user?.city || undefined)
        setLiveResult(res.data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, DEBOUNCE_MS)
  }, [text, user?.city])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const ai = liveResult?.ai
      const entry = await entriesApi.create({
        title: ai?.title || text.slice(0, 200),
        description: text,
        intent_type: ai?.intent_type || 'seeking_service',
        entry_type: ai?.entry_type || 'on_demand',
        category: ai?.category,
        city: user?.city,
      })
      await entriesApi.publish(entry.data.id)
      navigate('/app')
    } finally {
      setSubmitting(false)
    }
  }

  const hasMatches = (liveResult?.total ?? 0) > 0
  const ai = liveResult?.ai

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }}
        onClick={() => navigate(-1)} />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 430, zIndex: 90,
        background: '#F9F9F9', borderRadius: '24px 24px 0 0',
        maxHeight: '92dvh', overflowY: 'auto',
        boxShadow: '0 -8px 48px rgba(0,0,0,.22)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1D1D6', margin: '12px auto 0' }} />

        <div style={{ padding: '16px 16px 48px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Новий запис</h2>
            <button onClick={() => navigate(-1)} style={{
              background: 'rgba(118,118,128,.15)', border: 'none', cursor: 'pointer',
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>

          {/* Text area */}
          <div style={{
            background: '#fff', borderRadius: 18, padding: '14px 16px', marginBottom: 12,
            border: text.length > 0 ? '1.5px solid #111111' : '1.5px solid transparent',
            transition: 'border-color .2s',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Напиши що тобі потрібно або що ти пропонуєш...&#10;&#10;Наприклад: «потрібен електрик на п'ятницю» або «роблю сантехніку в Братиславі»"
              style={{
                width: '100%', minHeight: 110, border: 'none', outline: 'none', resize: 'none',
                fontSize: 16, lineHeight: 1.55, color: '#000', background: 'transparent',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />

            {/* AI status line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ fontSize: 12, color: '#C7C7CC' }}>{text.length}/500</div>
              {loading && (
                <div style={{ fontSize: 12, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                    background: '#111111', animation: 'pulse 1s infinite',
                  }} />
                  AI аналізує...
                </div>
              )}
            </div>
          </div>

          {/* AI result pill */}
          {ai && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              padding: '10px 14px', background: 'rgba(0,0,0,.04)',
              borderRadius: 14, marginBottom: 14, border: '1px solid rgba(0,0,0,.1)',
            }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333333' }}>
                  {intentLabel[ai.intent_type] ?? ai.intent_type} · {ai.category}
                </div>
                <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                  {urgencyMap[ai.urgency] ?? ai.urgency}
                  {ai.skills.length > 0 && ` · ${ai.skills.slice(0, 2).join(', ')}`}
                </div>
              </div>
              {hasMatches && (
                <div style={{
                  background: '#111111', color: '#fff',
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                }}>
                  {liveResult!.total} збіг{liveResult!.total === 1 ? '' : 'ів'}
                </div>
              )}
            </div>
          )}

          {/* ── LIVE MATCHES FROM DB ── */}
          {!loading && liveResult && liveResult.total > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                ⚡ Знайдено в базі прямо зараз
              </div>

              {/* Provider matches */}
              {liveResult.provider_matches.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#8E8E93', marginBottom: 6, fontWeight: 600 }}>
                    ВИКОНАВЦІ ({liveResult.provider_matches.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {liveResult.provider_matches.map(p => (
                      <div key={p.id} style={{
                        background: '#fff', borderRadius: 14, padding: '11px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                        border: '1px solid rgba(0,0,0,.08)',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', background: '#111111',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 1 }}>
                            {p.city && `📍 ${p.city} · `}
                            {p.rating > 0 && `⭐ ${p.rating.toFixed(1)} · `}
                            {p.jobs_completed > 0 && `${p.jobs_completed} робіт`}
                          </div>
                          {p.skills.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {p.skills.slice(0, 3).map(s => (
                                <span key={s} style={{
                                  fontSize: 10, padding: '2px 7px', borderRadius: 99,
                                  background: 'rgba(0,0,0,.05)', color: '#333333', fontWeight: 600,
                                }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {p.hourly_rate && (
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111111', flexShrink: 0 }}>
                            €{p.hourly_rate}/год
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entry matches */}
              {liveResult.entry_matches.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#8E8E93', marginBottom: 6, fontWeight: 600 }}>
                    ЗАПИСИ ({liveResult.entry_matches.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {liveResult.entry_matches.slice(0, 3).map(e => (
                      <div key={e.id} style={{
                        background: '#fff', borderRadius: 14, padding: '11px 14px',
                        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                        border: '1px solid rgba(0,0,0,.06)',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: '#8E8E93' }}>
                          {e.city && `📍 ${e.city}`}
                          {e.budget_min && ` · €${e.budget_min}–${e.budget_max}`}
                          {e.category && ` · ${e.category}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No matches empty state */}
          {!loading && liveResult && liveResult.total === 0 && text.length >= 8 && (
            <div style={{
              textAlign: 'center', padding: '16px', marginBottom: 14,
              background: 'rgba(118,118,128,.06)', borderRadius: 14,
            }}>
              <div style={{ fontSize: 13, color: '#8E8E93' }}>
                Поки немає збігів в базі — опублікуй і знайдемо першого
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{
              flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500,
              color: '#3C3C43', fontFamily: 'inherit',
            }}>
              Скасувати
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              style={{
                flex: 2, padding: 14, borderRadius: 14, border: 'none',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                background: text.trim() ? (hasMatches ? '#111111' : '#000') : '#C7C7CC',
                fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'inherit',
                transition: 'background .2s',
                boxShadow: text.trim() && hasMatches ? '0 4px 16px rgba(0,0,0,.2)' : 'none',
              }}
            >
              {submitting ? 'Публікуємо...' : hasMatches ? `Опублікувати · ${liveResult!.total} збіг` : 'Опублікувати →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
