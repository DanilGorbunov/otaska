import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function NewEntry() {
  const navigate = useNavigate()
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const createDraft = useMutation(api.entries.create)
  const [mode, setMode] = useState<'entry' | 'project'>('entry')
  const [text, setText] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const buildArgs = () => mode === 'entry'
    ? { title: text.slice(0, 80), description: text, intentType: 'seeking_service' as const, entryType: 'on_demand' as const, category: 'Інше', city: 'Bratislava', budgetMin: 0, budgetMax: 0 }
    : { title: projectTitle.trim(), description: projectTitle.trim(), intentType: 'seeking_service' as const, entryType: 'project' as const, category: 'Проєкт', city: 'Bratislava', budgetMin: 0, budgetMax: 0 }

  const handleSubmit = async (draft = false) => {
    const valid = mode === 'entry' ? text.trim() : projectTitle.trim()
    if (!valid) return
    setSubmitting(true)
    setError('')
    try {
      if (draft) {
        await createDraft(buildArgs())
      } else {
        await createAndPublish(buildArgs())
      }
      navigate(-1)
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Помилка. Спробуй ще раз.')
      setSubmitting(false)
    }
  }

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
        animation: 'sheetUp 0.34s cubic-bezier(0.25,0.46,0.45,0.94) both',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1D1D6', margin: '12px auto 0' }} />

        <div style={{ padding: '16px 16px 48px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {mode === 'project' ? 'Новий проєкт' : 'Новий запис'}
            </h2>
            <button onClick={() => navigate(-1)} style={{
              background: 'rgba(118,118,128,.15)', border: 'none', cursor: 'pointer',
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>

          {/* Mode segment */}
          <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(118,118,128,.12)', borderRadius: 9, marginBottom: 16 }}>
            {(['entry', 'project'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#000' : '#8E8E93',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
                transition: 'all .15s',
              }}>
                {m === 'entry' ? 'Запис' : 'Проєкт'}
              </button>
            ))}
          </div>

          {/* Project title field */}
          {mode === 'project' && (
            <input
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              placeholder="Назва проєкту..."
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid #E5E5EA',
                fontSize: 16, color: '#000', outline: 'none', background: '#fff',
                fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#111' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E5EA' }}
            />
          )}

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
            <div style={{ fontSize: 12, color: '#C7C7CC', marginTop: 6 }}>{text.length}/500</div>
          </div>

          {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 10 }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate(-1)} style={{
                flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500,
                color: '#3C3C43', fontFamily: 'inherit',
              }}>
                Скасувати
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={(mode === 'entry' ? !text.trim() : !projectTitle.trim()) || submitting}
                style={{
                  flex: 2, padding: 14, borderRadius: 14, border: 'none',
                  cursor: (mode === 'entry' ? text.trim() : projectTitle.trim()) ? 'pointer' : 'not-allowed',
                  background: (mode === 'entry' ? text.trim() : projectTitle.trim()) ? '#111111' : '#C7C7CC',
                  fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'inherit',
                  transition: 'background .2s',
                }}
              >
                {submitting ? 'Зберігаємо...' : mode === 'project' ? 'Створити проєкт →' : 'Опублікувати →'}
              </button>
            </div>
            {mode === 'entry' && (
              <button
                onClick={() => handleSubmit(true)}
                disabled={!text.trim() || submitting}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 14, border: '1.5px solid #EDE8DF',
                  cursor: text.trim() ? 'pointer' : 'not-allowed',
                  background: '#fff', fontSize: 14, fontWeight: 500,
                  color: text.trim() ? '#5A4A2E' : '#C7C7CC', fontFamily: 'inherit',
                }}
              >
                🔒 Зберегти як чернетку
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}
