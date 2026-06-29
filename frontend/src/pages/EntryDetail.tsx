import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { entriesApi, browseApi, proposalsApi, bookingsApi } from '../lib/api'
import type { Entry, Proposal } from '../types'
import { useAuthStore } from '../store/auth.store'
import { IntentBadge } from '../components/ui/IntentBadge'

export function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalPrice, setProposalPrice] = useState('')
  const [proposalMsg, setProposalMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)

  const isOwner = entry?.client_id === user?.id

  useEffect(() => {
    if (!id) return
    const loadEntry = isOwner
      ? entriesApi.proposals(id).then(() => {})
      : Promise.resolve()

    Promise.all([
      browseApi.entry(id).catch(() => null).then(r => r && setEntry(r.data)),
      entriesApi.list().then(r => {
        const mine = r.data.find((e: Entry) => e.id === id)
        if (mine) setEntry(mine)
      }).catch(() => {}),
    ]).finally(() => setLoading(false))

    // always try to load entry for owner
    if (id) {
      browseApi.entry(id).then(r => setEntry(r.data)).catch(() => {})
      entriesApi.proposals(id).then(r => setProposals(r.data)).catch(() => {})
    }
  }, [id])

  const handlePropose = async () => {
    if (!id || !proposalPrice) return
    setSubmitting(true)
    try {
      await proposalsApi.submit({ entry_id: id, price: Number(proposalPrice), message: proposalMsg })
      setShowProposalForm(false)
      setProposalPrice('')
      setProposalMsg('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (proposalId: string) => {
    await bookingsApi.accept(proposalId)
    navigate('/app')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
  if (!entry) return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Запис не знайдено</div>

  return (
    <div>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
        height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
      }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#111111', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" />
          </svg>
          <span style={{ fontSize: 17 }}>Назад</span>
        </button>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 17, fontWeight: 600 }}>
          Запис
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Entry info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{entry.title}</h1>
          {entry.description && <p style={{ fontSize: 15, color: '#3C3C43', margin: '0 0 12px' }}>{entry.description}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <IntentBadge type={entry.intent_type} />
            {entry.category && <span style={{ fontSize: 12, color: '#8E8E93' }}>{entry.category}</span>}
            {entry.city && <span style={{ fontSize: 12, color: '#8E8E93' }}>📍 {entry.city}</span>}
          </div>
        </div>

        {/* AI estimate */}
        {(entry.ai_estimate_min || entry.ai_estimate_max) && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
              AI кошторис
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#000' }}>
              €{entry.ai_estimate_min}–{entry.ai_estimate_max}
            </div>
            {entry.ai_urgency && (
              <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>
                {entry.ai_urgency === 'high' ? '🔴 Терміново' : entry.ai_urgency === 'medium' ? '🟡 Звичайно' : '🟢 Не спішно'}
              </div>
            )}
          </div>
        )}

        {/* Proposals */}
        {isOwner && proposals.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              {proposals.length} відповід{proposals.length === 1 ? 'ь' : 'і'}
            </div>
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 12 }}>
              {proposals.map(p => (
                <div key={p.id} style={{ padding: '14px 16px', borderBottom: '0.5px solid #E5E5EA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{p.provider?.name ?? 'Виконавець'}</span>
                      {p.provider?.city && <span style={{ fontSize: 13, color: '#8E8E93', marginLeft: 6 }}>· {p.provider.city}</span>}
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#111111' }}>€{p.price}</span>
                  </div>
                  {p.message && <p style={{ fontSize: 14, color: '#3C3C43', margin: '4px 0 8px' }}>{p.message}</p>}
                  {p.status === 'pending' && entry.status === 'open' && (
                    <button onClick={() => handleAccept(p.id)} style={{
                      width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: '#000', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                    }}>
                      Прийняти →
                    </button>
                  )}
                  {p.status === 'accepted' && (
                    <span style={{ fontSize: 13, color: '#34C759', fontWeight: 600 }}>✓ Прийнято</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Propose form for non-owners */}
        {!isOwner && entry.status === 'open' && (
          <div style={{ marginTop: 8 }}>
            {!showProposalForm ? (
              <button onClick={() => setShowProposalForm(true)} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: '#111111', color: '#fff', fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
              }}>
                Зробити пропозицію
              </button>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                  Ваша пропозиція
                </div>
                <input type="number" value={proposalPrice} onChange={e => setProposalPrice(e.target.value)}
                  placeholder="Ціна (€)"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E5EA',
                    fontSize: 17, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
                  }} />
                <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)}
                  placeholder="Повідомлення (необов'язково)..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E5EA',
                    fontSize: 15, outline: 'none', resize: 'none', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
                  }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowProposalForm(false)} style={{
                    flex: 1, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: '#3C3C43', fontFamily: 'inherit',
                  }}>
                    Скасувати
                  </button>
                  <button onClick={handlePropose} disabled={!proposalPrice || submitting} style={{
                    flex: 2, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: proposalPrice ? '#000' : '#C7C7CC', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                  }}>
                    {submitting ? 'Відправляємо...' : 'Відправити'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
