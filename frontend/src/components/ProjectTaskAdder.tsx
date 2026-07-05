import { useState } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export type PendingTask = {
  title: string
  category: string
  budgetMin: number
  budgetMax: number
  intentType: string
  selected: boolean
}

type Props = {
  projectTitle: string
  projectCity?: string
  // If projectId provided — creates tasks directly (EntryDetail mode)
  // If not — calls onPendingTasks with selected tasks (NewEntry mode)
  projectId?: Id<'entries'>
  onPendingTasks?: (tasks: PendingTask[]) => void
  onDone?: () => void
}

export function ProjectTaskAdder({ projectTitle, projectCity, projectId, onPendingTasks, onDone }: Props) {
  const [tab, setTab] = useState<'ai' | 'manual'>('ai')

  // AI mode state
  const [aiInput, setAiInput] = useState('')
  const [aiParsing, setAiParsing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<PendingTask[] | null>(null)
  const [aiCreating, setAiCreating] = useState(false)

  // Manual mode state
  const [manualText, setManualText] = useState('')
  const [manualAdding, setManualAdding] = useState(false)

  const parseProjectTasks = useAction(api.ai.parseProjectTasks)
  const createTask = useMutation(api.entries.createTask)

  const handleAiParse = async () => {
    const text = aiInput.trim()
    if (!text) return
    setAiParsing(true)
    try {
      const tasks = await parseProjectTasks({ text, projectTitle, projectCity }) as Omit<PendingTask, 'selected'>[]
      setAiSuggestions(tasks.map(t => ({ ...t, selected: true })))
      setAiInput('')
    } finally {
      setAiParsing(false)
    }
  }

  const handleAiCreate = async () => {
    if (!aiSuggestions) return
    const selected = aiSuggestions.filter(t => t.selected)
    if (!selected.length) return

    if (projectId) {
      // EntryDetail mode — create directly
      setAiCreating(true)
      try {
        for (const t of selected) {
          await createTask({
            projectId,
            title: t.title,
            intentType: (t.intentType as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job') || 'seeking_service',
            budgetMin: t.budgetMin > 0 ? t.budgetMin : undefined,
            budgetMax: t.budgetMax > 0 ? t.budgetMax : undefined,
            category: t.category || undefined,
          })
        }
        setAiSuggestions(null)
        onDone?.()
      } finally {
        setAiCreating(false)
      }
    } else {
      // NewEntry mode — pass to parent
      onPendingTasks?.(selected)
      setAiSuggestions(null)
    }
  }

  const handleManualAdd = async () => {
    const text = manualText.trim()
    if (!text) return

    if (projectId) {
      // EntryDetail mode — create directly
      setManualAdding(true)
      try {
        await createTask({ projectId, title: text, intentType: 'seeking_service' })
        setManualText('')
        onDone?.()
      } finally {
        setManualAdding(false)
      }
    } else {
      // NewEntry mode — pass to parent as single task
      onPendingTasks?.([{ title: text, category: 'Інше', budgetMin: 0, budgetMax: 0, intentType: 'seeking_service', selected: true }])
      setManualText('')
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(118,118,128,.12)', borderRadius: 10, marginBottom: 12 }}>
        {([['ai', '✦ AI'], ['manual', '✏️ Вручну']] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setAiSuggestions(null) }} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#000' : '#8E8E93',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
            transition: 'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {/* AI tab */}
      {tab === 'ai' && !aiSuggestions && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #EDE8DF', overflow: 'hidden' }}>
          <textarea
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiParse() } }}
            placeholder="Наприклад: «Потрібен електрик і сантехнік, ще маляр для двох кімнат бюджет 200 євро»"
            rows={3}
            style={{ width: '100%', padding: '14px', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', background: 'transparent', color: '#1A1612' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #EDE8DF' }}>
            <span style={{ fontSize: 12, color: '#C0B49A' }}>AI розбере на окремі таски</span>
            <button onClick={handleAiParse} disabled={!aiInput.trim() || aiParsing}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: aiInput.trim() ? '#1A1612' : '#EDE8DF', color: aiInput.trim() ? '#fff' : '#9A8060', fontSize: 13, fontWeight: 700, cursor: aiInput.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              {aiParsing ? '⏳ Аналізую...' : '✦ Розібрати →'}
            </button>
          </div>
        </div>
      )}

      {/* AI suggestions */}
      {tab === 'ai' && aiSuggestions && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1612', marginBottom: 10 }}>
            ✦ Знайдено {aiSuggestions.length} завдань — підтвердіть:
          </div>
          {aiSuggestions.map((t, i) => (
            <div key={i}
              onClick={() => setAiSuggestions(prev => prev ? prev.map((x, j) => j === i ? { ...x, selected: !x.selected } : x) : prev)}
              style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: `1.5px solid ${t.selected ? '#1A1612' : '#EDE8DF'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.selected ? '#1A1612' : '#C0B49A'}`, background: t.selected ? '#1A1612' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {t.selected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612' }}>{t.title}</div>
                <div style={{ fontSize: 12, color: '#9A8060', marginTop: 2 }}>
                  {t.category}{t.budgetMax > 0 ? ` · €${t.budgetMin}–${t.budgetMax}` : ''}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => setAiSuggestions(null)}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(118,118,128,.12)', fontSize: 14, fontWeight: 600, color: '#3C3C43', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Назад
            </button>
            <button onClick={handleAiCreate} disabled={aiCreating || !aiSuggestions.some(t => t.selected)}
              style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#1A1612', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              {aiCreating ? 'Створюємо...' : `✓ Додати ${aiSuggestions.filter(t => t.selected).length}`}
            </button>
          </div>
        </div>
      )}

      {/* Manual tab */}
      {tab === 'manual' && (
        <form onSubmit={e => { e.preventDefault(); handleManualAdd() }}
          style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Назва завдання: «Потрібен електрик»"
            autoFocus
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1A1612' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1A1612' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
          />
          <button type="submit" disabled={!manualText.trim() || manualAdding}
            style={{ padding: '12px 16px', borderRadius: 12, background: manualText.trim() ? '#1A1612' : '#EDE8DF', border: 'none', cursor: manualText.trim() ? 'pointer' : 'default', fontSize: 18, color: manualText.trim() ? '#fff' : '#9A8060' }}>
            +
          </button>
        </form>
      )}
    </div>
  )
}
