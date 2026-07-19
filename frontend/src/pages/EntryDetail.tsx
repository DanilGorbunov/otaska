import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ProjectTaskAdder } from '../components/ProjectTaskAdder'
import { ProjectMap } from '../components/projects/ProjectMap'

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
  return createPortal((
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 201, background: 'var(--bg-page)', borderRadius: '24px 24px 0 0', maxHeight: '75dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 48px rgba(0,0,0,.22)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: '12px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '12px 16px 8px', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0 }}>Публікація таску</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
          {state.msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              {m.role === 'assistant' && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0, fontSize: 12 }}>✦</div>}
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? 'var(--text-primary)' : '#fff', color: m.role === 'user' ? '#fff' : 'var(--text-primary)', fontSize: 14, border: m.role === 'assistant' ? '1px solid var(--border)' : 'none' }}>
                {m.content}
              </div>
            </div>
          ))}
          {state.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✦</div>
              <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid var(--border)', display: 'flex', gap: 3 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `dotA 1.3s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          {state.budgetMin !== undefined && (
            <button onClick={onDone} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit', marginTop: 8 }}>
              Опублікувати →
            </button>
          )}
        </div>
        <div style={{ padding: '8px 16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); if (input.trim()) { onMsg(input.trim()); setInput('') } }} style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Відповідь..." autoFocus
              style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
            <button type="submit" disabled={!input.trim() || state.loading}
              style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--text-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, opacity: !input.trim() || state.loading ? 0.4 : 1 }}>↑</button>
          </form>
        </div>
      </div>
      <style>{`@keyframes dotA { 0%,80%,100%{opacity:.25;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  ), document.body)
}

// ── Main component ────────────────────────────────────────────────────────────
export function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const entry = useQuery(api.entries.get, id ? { id: id as Id<'entries'> } : 'skip')
  const tasks = useQuery(api.entries.listTasks, entry?.entryType === 'project' && id ? { projectId: id as Id<'entries'> } : 'skip') ?? []
  const me = useQuery(api.users.getMe)
  const updateEntry = useMutation(api.entries.update)
  const removeEntry = useMutation(api.entries.remove)
  const moveToProject = useMutation(api.entries.moveToProject)
  const reorderEntries = useMutation(api.entries.reorderEntries)
  const createTask = useMutation(api.entries.createTask)
  const publishTask = useMutation(api.entries.publishTask)
  const sendProposal = useMutation(api.proposals.create)
  const acceptProposal = useMutation(api.proposals.accept)
  const markDone = useMutation(api.proposals.markDone)
  const mockPay = useMutation(api.proposals.mockPay)
  const disputeProposal = useMutation(api.proposals.dispute)
  const proposeRequote = useMutation(api.proposals.proposeRequote)
  const respondToRequote = useMutation(api.proposals.respondToRequote)
  const createReview = useMutation(api.reviews.create)
  const [reviewModal, setReviewModal] = useState<{ proposalId: string; revieweeName: string; tagOptions: string[] } | null>(null)
  const TAGS_FOR_RATING_PROVIDER = ['Прийшов вчасно', 'Якісна робота', 'Ввічливий', 'Порадив би']
  const TAGS_FOR_RATING_CLIENT = ['Чіткий опис', 'Оплатив вчасно', 'Ввічливий', 'Гнучкий графік']
  const [disputeModal, setDisputeModal] = useState<{ proposalId: string } | null>(null)
  const [disputeReasonText, setDisputeReasonText] = useState('')
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [requoteFormOpen, setRequoteFormOpen] = useState(false)
  const [requotePrice, setRequotePrice] = useState('')
  const [requoteReasonText, setRequoteReasonText] = useState('')
  const [requoteSubmitting, setRequoteSubmitting] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewTags, setReviewTags] = useState<string[]>([])
  const [reviewSending, setReviewSending] = useState(false)
  const proposals = useQuery(api.proposals.listForEntry, id ? { entryId: id as Id<'entries'> } : 'skip') ?? []
  const myProposal = useQuery(api.proposals.myProposalForEntry, id ? { entryId: id as Id<'entries'> } : 'skip')
  const callAI = useAction(api.ai.chat)
  const findMatches = useAction(api.ai.findMatches)
  const dismissMatch = useMutation(api.entries.dismissAiMatch)
  const sequenceProjectTasks = useAction(api.ai.sequenceProjectTasks)
  const [sequencing, setSequencing] = useState(false)

  const isOwn = me?._id != null && entry?.clientId === me._id

  // Proposal sheet
  const [proposalOpen, setProposalOpen] = useState(false)
  useEffect(() => {
    if (proposalOpen) document.body.classList.add('sheet-open')
    else document.body.classList.remove('sheet-open')
    return () => document.body.classList.remove('sheet-open')
  }, [proposalOpen])
  const [propMsg, setPropMsg] = useState('')
  const [propPrice, setPropPrice] = useState('')
  const [propSending, setPropSending] = useState(false)
  const sendSoundRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    sendSoundRef.current = new Audio('/new-notification.mp3')
    sendSoundRef.current.volume = 0.7
    sendSoundRef.current.load()
  }, [])

  const handleSendProposal = async () => {
    if (!propMsg.trim() || !id) return
    setPropSending(true)
    try {
      await sendProposal({ entryId: id as Id<'entries'>, message: propMsg, price: propPrice ? Number(propPrice) : undefined })
      if (sendSoundRef.current) { sendSoundRef.current.currentTime = 0; sendSoundRef.current.play().catch(() => {}) }
      setProposalOpen(false)
      setPropMsg(''); setPropPrice('')
      if (entry) navigate(`/app/chat/${entry.clientId}`)
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? ''
      if (msg.includes('Already proposed') && entry) {
        setProposalOpen(false)
        navigate(`/app/chat/${entry.clientId}`)
      } else {
        alert(msg || 'Помилка')
      }
    } finally {
      setPropSending(false)
    }
  }

  // AI matches — load from cache, run AI only if not cached yet
  const [aiMatches, setAiMatches] = useState<Array<{ _id: string; title: string; city?: string; category?: string; intentType: string; budgetMin?: number; budgetMax?: number }> | null>(null)
  const [loadingMatches, setLoadingMatches] = useState(false)

  const cachedIds = entry?.aiMatchIds ?? null
  const cachedEntries = useQuery(
    api.entries.getByIds,
    isOwn && cachedIds && cachedIds.length > 0 ? { ids: cachedIds } : 'skip'
  )

  useEffect(() => {
    if (!isOwn || !entry || entry.entryType === 'project' || entry.status !== 'open') return
    // If cache exists, use it
    if (cachedIds !== null) {
      if (cachedIds.length === 0) { setAiMatches([]); return }
      if (cachedEntries !== undefined) setAiMatches(cachedEntries as typeof aiMatches)
      return
    }
    // No cache — run AI
    if (aiMatches !== null || loadingMatches || !id) return
    setLoadingMatches(true)
    findMatches({ entryId: id as Id<'entries'> })
      .then(res => setAiMatches(res as unknown as typeof aiMatches))
      .catch(() => setAiMatches([]))
      .finally(() => setLoadingMatches(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwn, id, entry?._id, cachedIds, cachedEntries])

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
  // Publish chat state
  const [publishChat, setPublishChat] = useState<PublishState | null>(null)

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  const taskDragSensors = useSensors(mouseSensor, touchSensor)
  const [draggingTaskTitle, setDraggingTaskTitle] = useState<string | null>(null)

  if (entry === undefined) return (
    <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-secondary)', fontFamily: 'system-ui' }}>Завантаження…</div>
  )

  if (entry === null) return (
    <div style={{ fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>← Назад</button>
      </div>
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Запис не знайдено</div>
      </div>
    </div>
  )

  const isProject = entry.entryType === 'project'

  const handleSequence = async () => {
    setSequencing(true)
    try {
      await sequenceProjectTasks({ projectId: entry._id })
    } catch (e) {
      console.error(e)
    } finally {
      setSequencing(false)
    }
  }
  const statusColor = entry.status === 'open' ? 'var(--success)' : entry.status === 'draft' ? 'var(--text-dim)' : entry.status === 'cancelled' ? 'var(--danger)' : 'var(--accent)'
  const statusLabel = entry.status === 'open' ? 'Активно' : entry.status === 'draft' ? 'Чернетка' : entry.status === 'done' ? 'Виконано' : entry.status === 'in_progress' ? 'У процесі' : entry.status === 'cancelled' ? 'Скасовано' : entry.status ?? ''

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

  const byTaskOrder = (a: { taskOrder?: number }, b: { taskOrder?: number }) => (a.taskOrder ?? Infinity) - (b.taskOrder ?? Infinity)
  const draftTasks = tasks.filter(t => t.status === 'draft').sort(byTaskOrder)
  const openTasks = tasks.filter(t => t.status === 'open').sort(byTaskOrder)

  const handleTaskDragStart = (event: DragStartEvent) => {
    const found = tasks.find(t => t._id === event.active.id)
    if (found) setDraggingTaskTitle(found.title)
  }

  const handleTaskDragEnd = (event: DragEndEvent) => {
    setDraggingTaskTitle(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (over.id === 'detach-from-project') {
      moveToProject({ id: active.id as Id<'entries'>, projectId: null }).catch(() => null)
      return
    }

    // Reorder within whichever list (open/draft) both items belong to
    for (const list of [openTasks, draftTasks]) {
      const activeIndex = list.findIndex(t => t._id === active.id)
      const overIndex = list.findIndex(t => t._id === over.id)
      if (activeIndex === -1 || overIndex === -1) continue
      const reordered = arrayMove(list, activeIndex, overIndex)
      reorderEntries({ orderedIds: reordered.map(t => t._id) }).catch(() => null)
      return
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', background: 'var(--bg-page)', minHeight: '100dvh' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 60 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>← Назад</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{isProject ? 'Проєкт' : 'Запис'}</span>
        <div style={{ position: 'relative' }}>
          {isOwn && <>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />)}
            </button>
          </>}
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 61 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 62, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.14)', border: '1px solid var(--border)', minWidth: 180, overflow: 'hidden' }}>
                <button onClick={() => { setMenuOpen(false); startEdit() }}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit', textAlign: 'left', fontWeight: 500 }}>
                  ✏️ Редагувати
                </button>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--danger)', fontFamily: 'inherit', textAlign: 'left', fontWeight: 500 }}>
                  🗑 Видалити {isProject ? 'проєкт' : 'запис'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 20, border: '1.5px solid var(--border)', marginBottom: 16 }}>
          {!isProject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                {entry.category ?? 'Запис'}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
                <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
              </div>
            </div>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.3 }}>{entry.title}</h1>
          {entry.photoUrl && (
            <img src={entry.photoUrl} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 14, margin: '0 0 12px' }} />
          )}
          {entry.description && entry.description !== entry.title && (
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.6, margin: '0 0 12px' }}>{entry.description}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {entry.city && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {entry.city}</span>}
            {entry.budgetMin && entry.budgetMax && <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>€{entry.budgetMin}–{entry.budgetMax}</span>}
            {!isProject && entry.intentType && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {entry.intentType === 'seeking_service' ? '🔍 Шукаю послугу' : entry.intentType === 'offering_service' ? '⚡ Пропоную' : entry.intentType === 'seeking_job' ? '💼 Шукаю роботу' : '🪨 Матеріали'}
              </span>
            )}
          </div>

          {/* Author profile row — only for other users' entries */}
          {!isOwn && entry.clientId && (
            <div onClick={() => navigate(`/app/users/${entry.clientId}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--dark) 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                ?
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Переглянути профіль автора</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Рейтинг, досвід, навички</div>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          )}
        </div>

        {/* ── AI MATCHES (own entries only, auto-run) ── */}
        {isOwn && !isProject && entry.status === 'open' && (
          <div style={{ marginBottom: 16 }}>
            {loadingMatches && (
              <div style={{ padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, color: 'var(--text-secondary)' }}>
                Аналізуємо пропозиції у вашому місті…
              </div>
            )}
            {aiMatches !== null && !loadingMatches && aiMatches.length === 0 && (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Поки збігів не знайдено — сповістимо коли з'являться
              </div>
            )}
            {aiMatches !== null && !loadingMatches && aiMatches.map(m => (
              <div key={m._id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/app/entries/${m._id}`)}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {m.city && `📍 ${m.city}`}{m.category && ` · ${m.category}`}
                      {m.budgetMin != null && m.budgetMax != null && m.budgetMax > 0 && ` · €${m.budgetMin}–${m.budgetMax}`}
                    </div>
                  </div>
                  <button onClick={async e => {
                    e.stopPropagation()
                    setAiMatches(prev => prev ? prev.filter(x => x._id !== m._id) : prev)
                    await dismissMatch({ entryId: id as Id<'entries'>, dismissId: m._id })
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--text-dim)', fontSize: 16, lineHeight: 1, flexShrink: 0 }} title="Відхилити">
                    ×
                  </button>
                </div>
              </div>
            ))}
            {aiMatches !== null && !loadingMatches && (
              <button onClick={() => {
                setAiMatches(null)
                setLoadingMatches(true)
                findMatches({ entryId: id as Id<'entries'> })
                  .then(res => setAiMatches(res as unknown as typeof aiMatches))
                  .catch(() => setAiMatches([]))
                  .finally(() => setLoadingMatches(false))
              }} style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, fontFamily: 'inherit' }}>
                ↻ Оновити збіги
              </button>
            )}
          </div>
        )}

        {/* ── PROJECT: Task list ── */}
        {isProject && (
          <DndContext sensors={taskDragSensors} collisionDetection={closestCenter} onDragStart={handleTaskDragStart} onDragEnd={handleTaskDragEnd}>
            <ProjectMap tasks={tasks} />

            {tasks.length >= 2 && (
              <button onClick={handleSequence} disabled={sequencing}
                style={{ width: '100%', padding: 12, borderRadius: 14, border: '1.5px solid var(--border)', background: '#fff', cursor: sequencing ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit', marginBottom: 16 }}>
                {sequencing ? '✦ Оптимізуємо...' : '✦ Оптимізувати послідовність'}
              </button>
            )}

            {/* AI + Manual task adder */}
            <div style={{ marginBottom: 16 }}>
              <ProjectTaskAdder
                projectTitle={entry.title}
                projectCity={entry.city}
                projectId={entry._id}
              />
            </div>

            {/* Open tasks */}
            {openTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Опубліковані</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SortableContext items={openTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {openTasks.map(t => (
                      <TaskRow key={t._id} id={t._id} onOpen={() => navigate(`/app/entries/${t._id}`)}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                          {t.budgetMin && t.budgetMax && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>€{t.budgetMin}–{t.budgetMax}</div>}
                        </div>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </TaskRow>
                    ))}
                  </SortableContext>
                </div>
              </div>
            )}

            {/* Draft tasks */}
            {draftTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Чернетки</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SortableContext items={draftTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {draftTasks.map(t => (
                      <TaskRow key={t._id} id={t._id} onOpen={() => navigate(`/app/entries/${t._id}`)}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                          {t.category && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.category}</div>}
                        </div>
                        <button onClick={e => { e.stopPropagation(); startPublish(t._id, t.title) }} title="Опублікувати"
                          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </button>
                      </TaskRow>
                    ))}
                  </SortableContext>
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14 }}>Додай перший таск вище</div>
              </div>
            )}

            {draggingTaskTitle && <DetachDropZone />}

            <DragOverlay dropAnimation={null}>
              {draggingTaskTitle && (
                <div style={{
                  background: '#fff', borderRadius: 14, border: '1.5px solid var(--accent)', padding: '12px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,.18)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                  maxWidth: 320,
                }}>
                  {draggingTaskTitle}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* ── ENTRY: Action buttons ── */}
        {!isProject && !isOwn && entry.status === 'open' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={() => entry && navigate(`/app/chat/${entry.clientId}`, { state: { prefill: `👋 Пишу щодо вашого запису «${entry.title}»: ` } })}
              style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
              ✉️ Написати
            </button>
            <button onClick={() => setProposalOpen(true)}
              style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'var(--text-primary)', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
              💼 Надіслати пропозицію
            </button>
          </div>
        )}


        {/* ── PROPOSALS LIST (owner sees incoming proposals) ── */}
        {isOwn && proposals.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Пропозиції ({proposals.length})
            </div>
            {proposals.map(p => {
              const statusLabel: Record<string, string> = {
                pending: '⏳ Очікує', accepted: '✅ Прийнято', in_progress: '🔧 В роботі',
                done: '🏁 Завершено', disputed: '⚠️ Спірна', paid: '💰 Оплачено', rejected: '✗ Відхилено',
              }
              const statusColor: Record<string, string> = {
                pending: 'var(--text-secondary)', accepted: 'var(--success)', in_progress: 'var(--accent)',
                done: 'var(--info)', disputed: 'var(--danger)', paid: 'var(--purple)', rejected: 'var(--danger)',
              }
              return (
                <div key={p._id} style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.providerName}</div>
                      {p.providerVerified && (
                        <span title="Верифікований" style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 15, height: 15, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 900, flexShrink: 0,
                        }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: statusColor[p.status] }}>{statusLabel[p.status]}</div>
                  </div>
                  {p.price && <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>€{p.price}</div>}
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 10 }}>{p.message}</div>
                  {p.requoteStatus === 'pending' && (
                    <div style={{ background: 'var(--bg-accent-tint)', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-on-accent)', marginBottom: 2 }}>💬 Нова ціна: €{p.requotedPrice}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-on-accent)', marginBottom: 8 }}>{p.requoteReason}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => respondToRequote({ proposalId: p._id, accept: false })}
                          style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                          Відхилити
                        </button>
                        <button onClick={() => respondToRequote({ proposalId: p._id, accept: true })}
                          style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                          Прийняти
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigate(`/app/chat/${p.providerId}`)}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                      ✉️ Написати
                    </button>
                    {p.status === 'pending' && (
                      <button onClick={() => acceptProposal({ proposalId: p._id })}
                        style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                        ✅ Прийняти
                      </button>
                    )}
                    {p.status === 'done' && (
                      <>
                        <button onClick={() => setDisputeModal({ proposalId: p._id })}
                          style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--danger)', fontFamily: 'inherit' }}>
                          ⚠️ Оскаржити
                        </button>
                        <button onClick={async () => { await mockPay({ proposalId: p._id }); setReviewModal({ proposalId: p._id, revieweeName: p.providerName, tagOptions: TAGS_FOR_RATING_PROVIDER }) }}
                          style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'var(--purple)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                          💰 Оплатити €{p.price ?? '—'}
                        </button>
                      </>
                    )}
                    {p.status === 'disputed' && (
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--danger)' }}>⚠️ Спір: {p.disputeReason}</div>
                    )}
                    {p.status === 'paid' && (
                      <button onClick={() => setReviewModal({ proposalId: p._id, revieweeName: p.providerName, tagOptions: TAGS_FOR_RATING_PROVIDER })}
                        style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                        ⭐ Залишити відгук
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── MY PROPOSAL STATUS (provider sees own proposal) ── */}
        {!isOwn && myProposal && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ваша пропозиція</div>
            {{
              pending: <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>⏳ Очікує відповіді клієнта</div>,
              accepted: <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 700 }}>✅ Прийнято! Можна починати роботу.</div>,
              in_progress: (
                <div>
                  <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginBottom: 10 }}>🔧 Робота в процесі</div>

                  {myProposal.requoteStatus === 'pending' ? (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, padding: '10px 12px', background: 'var(--bg-accent-tint)', borderRadius: 10 }}>
                      ⏳ Очікуємо відповідь клієнта на нову ціну €{myProposal.requotedPrice}
                    </div>
                  ) : requoteFormOpen ? (
                    <div style={{ marginBottom: 10 }}>
                      <input type="number" value={requotePrice} onChange={e => setRequotePrice(e.target.value)} placeholder="Нова ціна (€)"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', marginBottom: 6, boxSizing: 'border-box' }} />
                      <textarea value={requoteReasonText} onChange={e => setRequoteReasonText(e.target.value)} placeholder="Чому обсяг більший за очікуваний?" rows={2}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', resize: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setRequoteFormOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>Скасувати</button>
                        <button disabled={requoteSubmitting || !requotePrice || !requoteReasonText.trim()} onClick={async () => {
                          setRequoteSubmitting(true)
                          try {
                            await proposeRequote({ proposalId: myProposal._id, newPrice: Number(requotePrice), reason: requoteReasonText.trim() })
                            setRequoteFormOpen(false); setRequotePrice(''); setRequoteReasonText('')
                          } finally { setRequoteSubmitting(false) }
                        }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                          {requoteSubmitting ? '...' : 'Надіслати'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setRequoteFormOpen(true)}
                      style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit', marginBottom: 8 }}>
                      💬 Змінити ціну (обсяг виявився іншим)
                    </button>
                  )}

                  <button onClick={() => markDone({ proposalId: myProposal._id })}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--info)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                    🏁 Позначити як завершено
                  </button>
                </div>
              ),
              done: <div style={{ fontSize: 14, color: 'var(--info)', fontWeight: 700 }}>🏁 Завершено — очікуємо оплату від клієнта</div>,
              disputed: (
                <div>
                  <div style={{ fontSize: 14, color: 'var(--danger)', fontWeight: 700, marginBottom: 4 }}>⚠️ Клієнт оскаржив виконання</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{myProposal.disputeReason}</div>
                </div>
              ),
              paid: (
                <div>
                  <div style={{ fontSize: 14, color: 'var(--purple)', fontWeight: 700, marginBottom: 10 }}>💰 Оплачено! Дякуємо за роботу.</div>
                  <button onClick={() => setReviewModal({ proposalId: myProposal._id, revieweeName: 'клієнта', tagOptions: TAGS_FOR_RATING_CLIENT })}
                    style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                    ⭐ Оцінити клієнта
                  </button>
                </div>
              ),
              rejected: <div style={{ fontSize: 14, color: 'var(--danger)' }}>✗ Пропозицію відхилено</div>,
            }[myProposal.status]}
          </div>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #FCA5A5' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, textAlign: 'center' }}>Видалити?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--bg-page)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>Видалити</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setEditing(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 201, background: 'var(--bg-page)', borderRadius: '24px 24px 0 0', maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,.22)', padding: '20px 16px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: '-8px auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Редагувати</div>
            {[
              { label: 'Назва', value: title, set: setTitle, placeholder: 'Назва' },
              { label: 'Місто', value: city, set: setCity, placeholder: 'Братислава' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Опис</div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опис..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff', resize: 'none', minHeight: 80, lineHeight: 1.5 }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
            </div>
            {!isProject && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[{ label: 'Від €', value: budgetMin, set: setBudgetMin }, { label: 'До €', value: budgetMax, set: setBudgetMax }].map(f => (
                  <div key={f.label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                    <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--border)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 14, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
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

      {/* Proposal sheet */}
      {/* Review modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: window.innerWidth > 500 ? 'center' : 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setReviewModal(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 301, background: 'var(--bg-page)', borderRadius: window.innerWidth > 500 ? 24 : '24px 24px 0 0', boxShadow: '0 8px 48px rgba(0,0,0,.28)', padding: '24px 16px', margin: window.innerWidth > 500 ? '0 16px' : 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Залишити відгук</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{reviewModal.revieweeName}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {[1,2,3,4,5].map(star => (
                <span key={star} onClick={() => setReviewRating(star)} style={{ fontSize: 36, cursor: 'pointer', opacity: star <= reviewRating ? 1 : 0.25, transition: 'opacity .15s' }}>⭐</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center', marginBottom: 16 }}>
              {reviewModal.tagOptions.map(tag => (
                <button key={tag} onClick={() => setReviewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${reviewTags.includes(tag) ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: reviewTags.includes(tag) ? 'var(--accent)' : '#fff', color: reviewTags.includes(tag) ? '#fff' : 'var(--text-tertiary)' }}>
                  {tag}
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              placeholder="Розкажіть про якість роботи (необов'язково)..."
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setReviewModal(null); setReviewTags([]) }} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Пропустити</button>
              <button disabled={reviewSending} onClick={async () => {
                setReviewSending(true)
                try {
                  await createReview({ proposalId: reviewModal.proposalId as Id<'proposals'>, rating: reviewRating, tags: reviewTags.length > 0 ? reviewTags : undefined, comment: reviewComment || undefined })
                  setReviewModal(null); setReviewComment(''); setReviewRating(5); setReviewTags([])
                } finally { setReviewSending(false) }
              }} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--text-primary)', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                {reviewSending ? 'Надсилаємо...' : '⭐ Відправити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {disputeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: window.innerWidth > 500 ? 'center' : 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setDisputeModal(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 301, background: 'var(--bg-page)', borderRadius: window.innerWidth > 500 ? 24 : '24px 24px 0 0', boxShadow: '0 8px 48px rgba(0,0,0,.28)', padding: '24px 16px', margin: window.innerWidth > 500 ? '0 16px' : 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Оскаржити виконання</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>Опишіть, що не так. Оплата не спишеться, поки спір не вирішено.</div>
            <textarea value={disputeReasonText} onChange={e => setDisputeReasonText(e.target.value)}
              placeholder="Наприклад: робота виконана не повністю..."
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDisputeModal(null); setDisputeReasonText('') }} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Скасувати</button>
              <button disabled={disputeSubmitting || !disputeReasonText.trim()} onClick={async () => {
                setDisputeSubmitting(true)
                try {
                  await disputeProposal({ proposalId: disputeModal.proposalId as Id<'proposals'>, reason: disputeReasonText.trim() })
                  setDisputeModal(null); setDisputeReasonText('')
                } finally { setDisputeSubmitting(false) }
              }} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: disputeReasonText.trim() ? 'pointer' : 'not-allowed', background: disputeReasonText.trim() ? 'var(--danger)' : 'var(--border-strong)', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                {disputeSubmitting ? 'Надсилаємо...' : '⚠️ Подати спір'}
              </button>
            </div>
          </div>
        </div>
      )}

      {proposalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: window.innerWidth > 500 ? 'center' : 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setProposalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 201, background: 'var(--bg-page)', borderRadius: window.innerWidth > 500 ? 24 : '24px 24px 0 0', boxShadow: '0 8px 48px rgba(0,0,0,.28)', maxHeight: '90dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: window.innerWidth > 500 ? '0 16px' : 0 }}>
            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: window.innerWidth > 500 ? '0' : '12px auto 8px', display: window.innerWidth > 500 ? 'none' : 'block' }} />
              <div style={{ padding: '16px 16px 0', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Надіслати пропозицію</div>
              <div style={{ padding: '0 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ваша ціна (€)</div>
                <input type="number" value={propPrice} onChange={e => setPropPrice(e.target.value)}
                  placeholder="Наприклад: 150"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 16, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
              </div>
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Повідомлення</div>
                <textarea value={propMsg} onChange={e => setPropMsg(e.target.value)}
                  placeholder="Розкажіть про себе і чому ви підходите для цієї роботи..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
              </div>
            </div>
            {/* Buttons — always visible, never scrolls away */}
            <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', background: 'var(--bg-page)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={() => setProposalOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={handleSendProposal} disabled={!propMsg.trim() || propSending}
                style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: propMsg.trim() ? 'pointer' : 'not-allowed', background: propMsg.trim() ? 'var(--text-primary)' : 'var(--border-strong)', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                {propSending ? 'Надсилаємо...' : '💼 Надіслати →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({ id, onOpen, children }: { id: Id<'entries'>; onOpen: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onOpen}
      style={{
        background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        opacity: isDragging ? 0.35 : 1, touchAction: 'none',
        transform: CSS.Transform.toString(transform), transition: transition ?? undefined,
      }}>
      {children}
    </div>
  )
}

function DetachDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'detach-from-project' })
  return (
    <div ref={setNodeRef}
      style={{
        marginBottom: 16, padding: '14px', borderRadius: 14, textAlign: 'center',
        border: isOver ? '1.5px dashed var(--danger)' : '1.5px dashed var(--text-dim)',
        background: isOver ? 'rgba(220,38,38,.06)' : 'rgba(154,128,96,.06)',
        color: isOver ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
        transition: 'background .1s, border-color .1s, color .1s',
      }}>
      ⤴ Відпусти тут, щоб прибрати з проєкту
    </div>
  )
}
