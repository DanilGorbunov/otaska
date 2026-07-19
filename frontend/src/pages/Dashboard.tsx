import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const myEntries = useQuery(api.entries.listMine) ?? []
  const matchCounts = useQuery(api.entries.listMatchCounts) ?? {}
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const updateEntry = useMutation(api.entries.update)
  const removeEntry = useMutation(api.entries.remove)
  const moveToProject = useMutation(api.entries.moveToProject)
  const reorderEntries = useMutation(api.entries.reorderEntries)
  const [search, setSearch] = useState('')
  const [publishingPending, setPublishingPending] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<Id<'entries'>>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [draggingItem, setDraggingItem] = useState<{ title?: string } | null>(null)

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  const dragSensors = useSensors(mouseSensor, touchSensor)

  // After registration: pending entries were saved to localStorage before signIn.
  // Now auth is ready — create them on first Dashboard mount.
  useEffect(() => {
    const raw = localStorage.getItem('otaska_pending_entries')
    if (!raw) return
    let pending: Array<{ title: string; description: string; intentType: string; entryType: string; category?: string; city?: string; budgetMin?: number; budgetMax?: number }>
    try { pending = JSON.parse(raw) } catch { localStorage.removeItem('otaska_pending_entries'); return }
    if (!pending.length) { localStorage.removeItem('otaska_pending_entries'); return }
    localStorage.removeItem('otaska_pending_entries')
    setPublishingPending(true)
    Promise.all(pending.map(e =>
      createAndPublish({
        title: e.title,
        description: e.description,
        intentType: e.intentType as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job',
        entryType: e.entryType as 'on_demand' | 'project' | 'material',
        category: e.category,
        city: e.city,
        budgetMin: e.budgetMin,
        budgetMax: e.budgetMax,
      }).catch(() => null)
    )).finally(() => setPublishingPending(false))
  }, [])

  const byManualOrder = (a: { taskOrder?: number }, b: { taskOrder?: number }) => (a.taskOrder ?? Infinity) - (b.taskOrder ?? Infinity)
  const projects = myEntries.filter(e => e.entryType === 'project').sort(byManualOrder)
  const entries = myEntries.filter(e => e.entryType !== 'project' && !e.projectId).sort(byManualOrder)
  const active = entries.filter(e => ['open', 'matched', 'booked', 'in_progress'].includes(e.status ?? '')).length
  const done = entries.filter(e => e.status === 'done').length
  const filteredEntries = entries.filter(e => (e.title ?? '').toLowerCase().includes(search.toLowerCase()))
  const filteredProjects = projects.filter(e => (e.title ?? '').toLowerCase().includes(search.toLowerCase()))
  const activeFilteredEntries = filteredEntries.filter(e => e.status !== 'done')
  const doneFilteredEntries = filteredEntries.filter(e => e.status === 'done')

  const toggleSelected = (id: Id<'entries'>) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkDone = async () => {
    setBulkBusy(true)
    try {
      await Promise.all([...selectedIds].map(id => updateEntry({ id, status: 'done' })))
      exitSelectMode()
    } finally {
      setBulkBusy(false)
    }
  }

  const allSelected = filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.has(e._id))

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredEntries.map(e => e._id)))
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Видалити ${selectedIds.size} запис(ів)? Дію не можна скасувати.`)) return
    setBulkBusy(true)
    try {
      await Promise.all([...selectedIds].map(id => removeEntry({ id })))
      exitSelectMode()
    } finally {
      setBulkBusy(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const found = filteredEntries.find(e => e._id === event.active.id) ?? filteredProjects.find(e => e._id === event.active.id)
    setDraggingItem(found ? { title: found.title } : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingItem(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'entry' && overType === 'project') {
      // dropped an entry onto a project card — move it in, doesn't touch order
      moveToProject({ id: active.id as Id<'entries'>, projectId: over.id as Id<'entries'> }).catch(() => null)
      return
    }
    if (activeType === 'entry' && overType === 'entry') {
      const oldIndex = activeFilteredEntries.findIndex(e => e._id === active.id)
      const newIndex = activeFilteredEntries.findIndex(e => e._id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(activeFilteredEntries, oldIndex, newIndex)
      reorderEntries({ orderedIds: reordered.map(e => e._id) }).catch(() => null)
      return
    }
    if (activeType === 'project' && overType === 'project') {
      const oldIndex = filteredProjects.findIndex(p => p._id === active.id)
      const newIndex = filteredProjects.findIndex(p => p._id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(filteredProjects, oldIndex, newIndex)
      reorderEntries({ orderedIds: reordered.map(p => p._id) }).catch(() => null)
    }
  }

  return (
    <DndContext sensors={dragSensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div style={{ background: 'var(--bg-page)', minHeight: '100dvh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Publishing banner */}
      {publishingPending && (
        <div style={{ background: 'var(--accent)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Публікуємо твої записи…</span>
        </div>
      )}

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(245,244,241,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(154,128,96,.2)',
      }}>
        <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>Мої записи</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {active > 0 ? `${active} активних · ${done} виконано` : 'Немає активних записів'}
            </div>
          </div>
          {filteredEntries.length > 0 && (
            <button onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              style={{ marginTop: 4, padding: '6px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: selectMode ? 'var(--text-primary)' : '#fff', color: selectMode ? '#fff' : 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {selectMode ? 'Скасувати' : 'Вибрати'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук у записах..."
            style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Entries + Projects */}
      {myEntries.length === 0 && !publishingPending ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Ще немає записів</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Натисни + щоб додати перший запис</div>
          <button onClick={() => navigate('/app/new', { state: { backgroundLocation: location } })}
            style={{ padding: '14px 28px', borderRadius: 14, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'system-ui' }}>
            Додати запис →
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredEntries.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Записи</div>
                {selectMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedIds.size > 0 && (
                      <>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedIds.size} обрано</span>
                        <IconButton disabled={bulkBusy} onClick={handleBulkDone} title="Позначити виконаним" color="var(--success)">
                          <path d="M1 5l3.5 3.5L11 1" />
                        </IconButton>
                        <IconButton disabled={bulkBusy} onClick={handleBulkDelete} title="Видалити" color="var(--danger)">
                          <path d="M2 3.5h10M6 3.5v-1a1 1 0 011-1h2a1 1 0 011 1v1m2 0l-.7 8.4a1 1 0 01-1 .9H5.7a1 1 0 01-1-.9L4 3.5" />
                        </IconButton>
                      </>
                    )}
                    <button onClick={toggleSelectAll}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {allSelected ? 'Скасувати всі' : 'Вибрати всі'}
                    </button>
                  </div>
                )}
              </div>
              <SortableContext items={activeFilteredEntries.map(e => e._id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeFilteredEntries.map(e => (
                    <EntryCard key={e._id} entry={e} selectMode={selectMode} selected={selectedIds.has(e._id)}
                      onToggle={() => toggleSelected(e._id)} onOpen={() => navigate(`/app/entries/${e._id}`)}
                      dragDisabled={selectMode} />
                  ))}
                </div>
              </SortableContext>

              {doneFilteredEntries.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setShowDone(s => !s)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: showDone ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s', flexShrink: 0 }}>
                      <path d="M2 1l4 5-4 5" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Виконані ({doneFilteredEntries.length})
                    </span>
                  </button>
                  {showDone && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {doneFilteredEntries.map(e => (
                        <EntryCard key={e._id} entry={e} selectMode={selectMode} selected={selectedIds.has(e._id)}
                          onToggle={() => toggleSelected(e._id)} onOpen={() => navigate(`/app/entries/${e._id}`)} muted
                          dragDisabled={selectMode} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Проєкти</div>
              <SortableContext items={filteredProjects.map(e => e._id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredProjects.map(e => {
                    const m = matchCounts[e._id] as { count: number; first?: { _id: string; title: string; city?: string } } | undefined
                    const count = m?.count ?? 0
                    return (
                      <ProjectCard key={e._id} id={e._id} title={e.title} city={e.city} count={count}
                        onOpen={() => navigate(`/app/entries/${e._id}`)} />
                    )
                  })}
                </div>
              </SortableContext>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} } @keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
    <DragOverlay dropAnimation={null}>
      {draggingItem && (
        <div style={{
          background: '#fff', borderRadius: 16, border: '1.5px solid var(--accent)', padding: '14px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,.18)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
          maxWidth: 320, opacity: 0.95,
        }}>
          {draggingItem.title}
        </div>
      )}
    </DragOverlay>
    </DndContext>
  )
}

function ProjectCard({ id, title, city, count, onOpen }: {
  id: Id<'entries'>; title?: string; city?: string; count: number; onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, isOver, isDragging } = useSortable({ id, data: { type: 'project' } })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onOpen}
      style={{
        background: isOver ? 'rgba(239,159,39,.08)' : '#fff', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
        border: isOver ? '1.5px dashed var(--accent)' : '1.5px solid var(--border)', transition: 'background .1s, border-color .1s',
        opacity: isDragging ? 0.35 : 1, touchAction: 'none',
      }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>📁</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          {city && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{city}</div>}
        </div>
        {count > 0
          ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
              {count}
            </span>
          : <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
            </span>
        }
      </div>
    </div>
  )
}

function IconButton({ onClick, disabled, title, color, children }: {
  onClick: () => void; disabled?: boolean; title: string; color: string; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, padding: 0,
        border: '1.5px solid var(--border)', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

interface EntryCardData {
  _id: Id<'entries'>
  title?: string
  category?: string
  city?: string
  budgetMin?: number
  budgetMax?: number
  aiMatchCount?: number
}

function EntryCard({ entry: e, selectMode, selected, onToggle, onOpen, muted, dragDisabled }: {
  entry: EntryCardData; selectMode: boolean; selected: boolean; onToggle: () => void; onOpen: () => void
  muted?: boolean; dragDisabled?: boolean
}) {
  const hasAi = e.aiMatchCount != null
  const count = e.aiMatchCount ?? 0
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: e._id, data: { type: 'entry' }, disabled: dragDisabled })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      onClick={() => selectMode ? onToggle() : onOpen()}
      style={{
        background: muted ? 'var(--bg-field)' : '#fff', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
        border: selected ? '1.5px solid var(--accent)' : muted ? '1.5px solid var(--border)' : '1.5px solid var(--border)',
        opacity: isDragging ? 0.35 : 1, touchAction: dragDisabled ? undefined : 'none',
      }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {selectMode && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            border: selected ? 'none' : '1.5px solid var(--text-dim)',
            background: selected ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {selected && (
              <svg width="11" height="9" viewBox="0 0 12 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 5l3.5 3.5L11 1" />
              </svg>
            )}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: muted ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom: 2, textDecoration: muted ? 'line-through' : 'none' }}>
            {e.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {e.category}{e.city ? ` · ${e.city}` : ''}{e.budgetMin && e.budgetMax ? ` · €${e.budgetMin}–${e.budgetMax}` : ''}
          </div>
        </div>
        {selectMode ? null : muted
          ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', background: 'rgba(34,197,94,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
              ✓ Виконано
            </span>
          : !hasAi
            ? <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
              </span>
            : count > 0
              ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'rgba(239,159,39,.12)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                  {count}
                </span>
              : <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>0 збігів</span>
        }
      </div>
    </div>
  )
}
