import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { IntentBadge } from '../components/ui/IntentBadge'
import { MOCK_ENTRIES, MOCK_BROWSE_ENTRIES, MOCK_PROPOSALS, MOCK_USER } from '../lib/mockData'

const statusLabel: Record<string, string> = {
  draft: 'Чернетка', open: 'Відкрито', matched: 'Знайдено',
  booked: 'Заброньовано', in_progress: 'Виконується', done: 'Виконано ✓', cancelled: 'Скасовано',
}
const statusColor: Record<string, string> = {
  open: '#007AFF', matched: '#FF9500', booked: '#FF9500',
  in_progress: '#FF9500', done: '#34C759', cancelled: '#FF3B30', draft: '#8E8E93',
}
const urgencyLabel: Record<string, string> = {
  high: '🔴 Терміново', medium: '🟡 Звичайно', low: '🟢 Не спішно',
}
const categoryEmoji: Record<string, string> = {
  electric: '⚡', plumbing: '🔧', renovation: '🏗️', painting: '🎨',
  tiling: '🪟', carpentry: '🪚', materials: '🪨', labor: '👷', moving: '📦',
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF9500" stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}

function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600, color: '#007AFF',
      background: 'rgba(0,122,255,.1)', padding: '2px 7px', borderRadius: 20,
    }}>
      ✓ Верифіковано
    </span>
  )
}

export function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalPrice, setProposalPrice] = useState('')
  const [proposalMsg, setProposalMsg] = useState('')
  const [accepted, setAccepted] = useState<string | null>(null)

  const allEntries = [...MOCK_ENTRIES, ...MOCK_BROWSE_ENTRIES]
  const entry = allEntries.find(e => e.id === id)
  const proposals = MOCK_PROPOSALS[id ?? ''] ?? []
  const isOwner = entry?.client_id === MOCK_USER.id

  if (!entry) return (
    <div>
      <NavBar title="Запис" />
      <div style={{ textAlign: 'center', padding: 64, color: '#8E8E93' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Запис не знайдено</div>
      </div>
    </div>
  )

  const emoji = categoryEmoji[entry.category ?? ''] ?? '🔨'
  const fromBrowse = MOCK_BROWSE_ENTRIES.some(e => e.id === id)
  const backTitle = fromBrowse ? 'Знайти' : 'Записи'

  return (
    <div style={{ paddingBottom: 32 }}>
      <NavBar title="Деталі" backTitle={backTitle} />

      {/* Hero card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,.08)', marginBottom: 12,
        }}>
          {/* Category + urgency */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#8E8E93',
              background: 'rgba(118,118,128,.1)', padding: '4px 10px', borderRadius: 20,
            }}>
              {emoji} {entry.category ?? 'Загальне'}
            </span>
            {entry.ai_urgency === 'high' && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#FF3B30',
                background: 'rgba(255,59,48,.1)', padding: '4px 10px', borderRadius: 20,
              }}>Терміново</span>
            )}
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3, letterSpacing: '-.3px' }}>
            {entry.title}
          </h1>

          {entry.description && (
            <p style={{ fontSize: 15, color: '#3C3C43', margin: '0 0 14px', lineHeight: 1.55 }}>
              {entry.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <IntentBadge type={entry.intent_type} />
            {entry.city && (
              <span style={{ fontSize: 13, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 3 }}>
                📍 {entry.city}
              </span>
            )}
          </div>

          {/* Price + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '0.5px solid #E5E5EA' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>
                Бюджет
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000', letterSpacing: '-.5px' }}>
                €{entry.budget_min}–{entry.budget_max}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                Статус
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: statusColor[entry.status] ?? '#8E8E93',
                background: `${statusColor[entry.status] ?? '#8E8E93'}18`,
                padding: '4px 10px', borderRadius: 20,
              }}>
                {statusLabel[entry.status] ?? entry.status}
              </span>
            </div>
          </div>
        </div>

        {/* Urgency pill */}
        {entry.ai_urgency && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '12px 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{urgencyLabel[entry.ai_urgency]?.split(' ')[0]}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{urgencyLabel[entry.ai_urgency]?.slice(2)}</div>
              <div style={{ fontSize: 12, color: '#8E8E93' }}>Рівень терміновості</div>
            </div>
          </div>
        )}

        {/* ── OWNER VIEW: Proposals ── */}
        {isOwner && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10, marginTop: 4 }}>
              {proposals.length > 0 ? `${proposals.length} пропозиц${proposals.length === 1 ? 'ія' : 'ії'}` : 'Пропозиції'}
            </div>

            {proposals.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 16, padding: '32px 16px',
                textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 12,
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#000', marginBottom: 6 }}>Шукаємо виконавців</div>
                <div style={{ fontSize: 13, color: '#8E8E93' }}>Сповістимо коли хтось відгукнеться</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                {proposals.map(p => (
                  <div key={p.id} style={{
                    background: '#fff', borderRadius: 16, padding: 16,
                    boxShadow: '0 1px 6px rgba(0,0,0,.07)',
                    border: accepted === p.id ? '2px solid #34C759' : '1px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => navigate(`/app/users/${p.id}`)}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: '#111',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{p.initials}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#007AFF' }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <StarIcon />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.rating}</span>
                            <span style={{ fontSize: 12, color: '#8E8E93' }}>· {p.jobs} робіт</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px' }}>€{p.price}</div>
                        <div style={{ fontSize: 12, color: '#8E8E93' }}>{p.time}</div>
                      </div>
                    </div>

                    {p.verified && <div style={{ marginBottom: 10 }}><VerifiedBadge /></div>}

                    <p style={{ fontSize: 14, color: '#3C3C43', margin: '0 0 12px', lineHeight: 1.5 }}>{p.message}</p>

                    {accepted === p.id ? (
                      <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 15, fontWeight: 700, color: '#34C759' }}>
                        ✓ Прийнято
                      </div>
                    ) : accepted ? null : (
                      <button onClick={() => setAccepted(p.id)} style={{
                        width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                        background: '#111', color: '#fff', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        Прийняти пропозицію →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BROWSE VIEW: Make proposal ── */}
        {!isOwner && entry.status === 'open' && (
          <div style={{ marginTop: 4 }}>
            {!showProposalForm ? (
              <button onClick={() => setShowProposalForm(true)} style={{
                width: '100%', padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
                background: '#111', color: '#fff', fontSize: 17, fontWeight: 700,
                fontFamily: 'inherit', letterSpacing: '-.2px',
              }}>
                Зробити пропозицію
              </button>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.08)' }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Ваша пропозиція</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ЦІНА (€)</div>
                  <input type="number" value={proposalPrice} onChange={e => setProposalPrice(e.target.value)}
                    placeholder="Наприклад: 450"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E5E5EA',
                      fontSize: 20, fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#111' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E5EA' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>ПОВІДОМЛЕННЯ</div>
                  <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)}
                    placeholder="Розкажіть про свій досвід та терміни..."
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E5E5EA',
                      fontSize: 15, outline: 'none', resize: 'none', minHeight: 90,
                      fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#111' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E5EA' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowProposalForm(false)} style={{
                    flex: 1, padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 600,
                    color: '#3C3C43', fontFamily: 'inherit',
                  }}>Скасувати</button>
                  <button
                    onClick={() => { setShowProposalForm(false); setProposalPrice(''); setProposalMsg(''); navigate('/app/chat/c1') }}
                    disabled={!proposalPrice}
                    style={{
                      flex: 2, padding: 14, borderRadius: 12, border: 'none',
                      cursor: proposalPrice ? 'pointer' : 'not-allowed',
                      background: proposalPrice ? '#111' : '#C7C7CC',
                      color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    }}>Відправити →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
