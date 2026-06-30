import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// ── Mini AI publish chat ──────────────────────────────────────────────────────
type AIMsg = { role: 'user' | 'assistant'; content: string }
type PublishState = { taskId: Id<'entries'>; msgs: AIMsg[]; loading: boolean; budgetMin?: number; budgetMax?: number; category?: string; intentType?: string }

function PublishChat({ state, onMsg, onDone, onClose }: {
  state: PublishState
  onMsg: (text: string) => void
  onDone: () => void
  onClose: () => void
}) {
  const [input, setInput] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 201, background: '#F5F4F1', borderRadius: '24px 24px 0 0', maxHeight: '75dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 48px rgba(0,0,0,.22)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1C8B8', margin: '12px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '12px 16px 8px', fontSize: 16, fontWeight: 800, color: '#1A1612', flexShrink: 0 }}>Публікація таску</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
          {state.msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              {m.role === 'assistant' && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0, fontSize: 12 }}>✦</div>}
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? '#1A1612' : '#fff', color: m.role === 'user' ? '#fff' : '#1A1612', fontSize: 14, border: m.role === 'assistant' ? '1px solid #EDE8DF' : 'none' }}>
                {m.content}
              </div>
            </div>
          ))}
          {state.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✦</div>
              <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid #EDE8DF', display: 'flex', gap: 3 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF9F27', display: 'inline-block', animation: `dotA 1.3s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          {state.budgetMin !== undefined && (
            <button onClick={onDone} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1A1612', fontFamily: 'inherit', marginTop: 8 }}>
              Опублікувати →
            </button>
          )}
        </div>
        <div style={{ padding: '8px 16px 24px', borderTop: '1px solid #EDE8DF', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); if (input.trim()) { onMsg(input.trim()); setInput('') } }} style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Відповідь..." autoFocus
              style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
            <button type="submit" disabled={!input.trim() || state.loading}
              style={{ padding: '11px 14px', borderRadius: 12, background: '#1A1612', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, opacity: !input.trim() || state.loading ? 0.4 : 1 }}>↑</button>
          </form>
        </div>
      </div>
      <style>{`@keyframes dotA { 0%,80%,100%{opacity:.25;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const entry = useQuery(api.entries.get, id ? { id: id as Id<'entries'> } : 'skip')
  const tasks = useQuery(api.entries.listTasks, entry?.entryType === 'project' && id ? { projectId: id as Id<'entries'> } : 'skip') ?? []
  const updateEntry = useMutation(api.entries.update)
  const removeEntry = useMutation(api.entries.remove)
  const createTask = useMutation(api.entries.createTask)
  const publishTask = useMutation(api.entries.publishTask)
  const callAI = useAction(api.ai.chat)

  // Edit state
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Task add state
  const [newTaskText, setNewTaskText] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  // Publish chat state
  const [publishChat, setPublishChat] = useState<PublishState | null>(null)

  if (entry === undefined) return (
    <div style={{ textAlign: 'center', padding: 64, color: '#9A8060', fontFamily: 'system-ui' }}>Завантаження…</div>
  )

  if (entry === null) return (
    <div style={{ fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', borderBottom: '1px solid #EDE8DF' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9A8060', fontFamily: 'inherit' }}>← Назад</button>
      </div>
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1612' }}>Запис не знайдено</div>
      </div>
    </div>
  )

  const isProject = entry.entryType === 'project'
  const statusColor = entry.status === 'open' ? '#22C55E' : entry.status === 'draft' ? '#B4A898' : '#EF9F27'
  const statusLabel = entry.status === 'open' ? 'Активно' : entry.status === 'draft' ? 'Чернетка' : entry.status === 'done' ? 'Виконано' : entry.status ?? ''

  const startEdit = () => {
    setTitle(entry.title ?? '')
    setDescription(entry.description ?? '')
    setCity(entry.city ?? '')
    setBudgetMin(entry.budgetMin ? String(entry.budgetMin) : '')
    setBudgetMax(entry.budgetMax ? String(entry.budgetMax) : '')
    setEditing(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    try {
      await updateEntry({ id: entry._id, title: title.trim() || undefined, description: description.trim() || undefined, city: city.trim() || undefined, budgetMin: budgetMin ? Number(budgetMin) : undefined, budgetMax: budgetMax ? Number(budgetMax) : undefined })
      setEditing(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await removeEntry({ id: entry._id })
    navigate('/app', { replace: true })
  }

  const handleAddTask = async () => {
    const text = newTaskText.trim()
    if (!text) return
    setAddingTask(true)
    try {
      await createTask({ projectId: entry._id, title: text, intentType: 'seeking_service' })
      setNewTaskText('')
    } finally { setAddingTask(false) }
  }

  // Start publish chat for a task
  const startPublish = async (taskId: Id<'entries'>, taskTitle: string) => {
    const firstMsg: AIMsg = { role: 'assistant', content: `Публікую "${taskTitle}". Який орієнтовний бюджет (€)?` }
    setPublishChat({ taskId, msgs: [firstMsg], loading: false })
  }

  // Handle message in publish chat
  const handlePublishMsg = async (text: string) => {
    if (!publishChat) return
    const newMsgs: AIMsg[] = [...publishChat.msgs, { role: 'user', content: text }]
    setPublishChat(prev => prev ? { ...prev, msgs: newMsgs, loading: true } : null)

    try {
      // Extract budget from first user reply
      if (publishChat.msgs.length === 1) {
        const nums = text.match(/\d+/g)?.map(Number) ?? []
        const min = nums[0] ?? 0
        const max = nums[1] ?? nums[0] ?? 0
        // Ask category if not obvious
        const task = tasks.find(t => t._id === publishChat.taskId)
        const assistantMsg: AIMsg = { role: 'assistant', content: `Бюджет ${min > 0 ? `€${min}${max && max !== min ? `–${max}` : ''}` : 'не вказано'}. Готово до публікації!` }
        setPublishChat(prev => prev ? { ...prev, msgs: [...newMsgs, assistantMsg], loading: false, budgetMin: min || undefined, budgetMax: max || undefined, category: task?.category } : null)
      } else {
        const assistantMsg: AIMsg = { role: 'assistant', content: 'Готово!' }
        setPublishChat(prev => prev ? { ...prev, msgs: [...newMsgs, assistantMsg], loading: false } : null)
      }
    } catch {
      setPublishChat(prev => prev ? { ...prev, loading: false } : null)
    }
  }

  const handlePublishDone = async () => {
    if (!publishChat) return
    await publishTask({ id: publishChat.taskId, budgetMin: publishChat.budgetMin, budgetMax: publishChat.budgetMax })
    setPublishChat(null)
  }

  const draftTasks = tasks.filter(t => t.status === 'draft')
  const openTasks = tasks.filter(t => t.status === 'open')

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', background: '#F5F4F1', minHeight: '100dvh' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F5F4F1', borderBottom: '1px solid #EDE8DF', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9A8060', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>← Назад</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1612' }}>{isProject ? 'Проєкт' : 'Запис'}</span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#9A8060' }} />)}
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.14)', border: '1px solid #EDE8DF', minWidth: 180, overflow: 'hidden' }}>
                <button onClick={() => { setMenuOpen(false); startEdit() }}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#1A1612', fontFamily: 'inherit', textAlign: 'left', fontWeight: 500 }}>
                  ✏️ Редагувати
                </button>
                <div style={{ height: 1, background: '#EDE8DF' }} />
                <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#DC2626', fontFamily: 'inherit', textAlign: 'left', fontWeight: 500 }}>
                  🗑 Видалити {isProject ? 'проєкт' : 'запис'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1.5px solid #EDE8DF', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {isProject && <span style={{ fontSize: 22 }}>📁</span>}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {isProject ? entry.title : entry.category ?? 'Запис'}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
            </div>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1612', margin: '0 0 8px', lineHeight: 1.3 }}>{entry.title}</h1>
          {entry.description && entry.description !== entry.title && (
            <p style={{ fontSize: 14, color: '#5A4A2E', lineHeight: 1.6, margin: '0 0 12px' }}>{entry.description}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, paddingTop: 12, borderTop: '1px solid #EDE8DF' }}>
            {entry.city && <span style={{ fontSize: 13, color: '#9A8060' }}>📍 {entry.city}</span>}
            {entry.budgetMin && entry.budgetMax && <span style={{ fontSize: 16, fontWeight: 800, color: '#EF9F27' }}>€{entry.budgetMin}–{entry.budgetMax}</span>}
            {!isProject && entry.intentType && (
              <span style={{ fontSize: 13, color: '#9A8060' }}>
                {entry.intentType === 'seeking_service' ? '🔍 Шукаю послугу' : entry.intentType === 'offering_service' ? '⚡ Пропоную' : entry.intentType === 'seeking_job' ? '💼 Шукаю роботу' : '🪨 Матеріали'}
              </span>
            )}
          </div>
        </div>

        {/* ── PROJECT: Task list ── */}
        {isProject && (
          <>
            {/* Quick add */}
            <form onSubmit={e => { e.preventDefault(); handleAddTask() }}
              style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                placeholder="Додати таск: «Потрібен електрик»"
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1A1612' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
              />
              <button type="submit" disabled={!newTaskText.trim() || addingTask}
                style={{ padding: '12px 16px', borderRadius: 12, background: newTaskText.trim() ? '#EF9F27' : '#EDE8DF', border: 'none', cursor: newTaskText.trim() ? 'pointer' : 'default', fontSize: 18, color: '#1A1612', transition: 'background .15s' }}>
                +
              </button>
            </form>

            {/* Open tasks */}
            {openTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Опубліковані</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {openTasks.map(t => (
                    <div key={t._id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #EDE8DF', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612' }}>{t.title}</div>
                        {t.budgetMin && t.budgetMax && <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 700 }}>€{t.budgetMin}–{t.budgetMax}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,.1)', padding: '3px 8px', borderRadius: 20 }}>відкрито</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Draft tasks */}
            {draftTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Чернетки</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {draftTasks.map(t => (
                    <div key={t._id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #EDE8DF', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1C8B8', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612' }}>{t.title}</div>
                        {t.category && <div style={{ fontSize: 12, color: '#9A8060' }}>{t.category}</div>}
                      </div>
                      <button onClick={() => startPublish(t._id, t.title)}
                        style={{ padding: '6px 12px', borderRadius: 20, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1A1612', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
                        Опублікувати →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9A8060' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14 }}>Додай перший таск вище</div>
              </div>
            )}
          </>
        )}

        {/* ── ENTRY: Proposals ── */}
        {!isProject && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', border: '1.5px solid #EDE8DF', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612', marginBottom: 4 }}>Шукаємо виконавців</div>
            <div style={{ fontSize: 13, color: '#9A8060' }}>Сповістимо коли хтось відгукнеться</div>
          </div>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #FCA5A5' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612', marginBottom: 12, textAlign: 'center' }}>Видалити?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F5F4F1', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#5A4A2E', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>Видалити</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setEditing(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 201, background: '#F5F4F1', borderRadius: '24px 24px 0 0', maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,.22)', padding: '20px 16px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1C8B8', margin: '-8px auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1612', marginBottom: 16 }}>Редагувати</div>
            {[
              { label: 'Назва', value: title, set: setTitle, placeholder: 'Назва' },
              { label: 'Місто', value: city, set: setCity, placeholder: 'Братислава' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, color: '#1A1612', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Опис</div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опис..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, color: '#1A1612', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff', resize: 'none', minHeight: 80, lineHeight: 1.5 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }} />
            </div>
            {!isProject && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[{ label: 'Від €', value: budgetMin, set: setBudgetMin }, { label: 'До €', value: budgetMax, set: setBudgetMax }].map(f => (
                  <div key={f.label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                    <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, color: '#1A1612', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#EDE8DF', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#5A4A2E', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 14, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1A1612', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Зберігаємо…' : 'Зберегти →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish chat overlay */}
      {publishChat && (
        <PublishChat
          state={publishChat}
          onMsg={handlePublishMsg}
          onDone={handlePublishDone}
          onClose={() => setPublishChat(null)}
        />
      )}
    </div>
  )
}
