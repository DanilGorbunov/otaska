import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const entry = useQuery(api.entries.get, id ? { id: id as Id<'entries'> } : 'skip')
  const updateEntry = useMutation(api.entries.update)
  const removeEntry = useMutation(api.entries.remove)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (entry === undefined) return (
    <div style={{ textAlign: 'center', padding: 64, color: '#9A8060', fontFamily: 'system-ui' }}>
      Завантаження…
    </div>
  )

  if (entry === null) return (
    <div style={{ fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', borderBottom: '1px solid #EDE8DF' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9A8060', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Назад
        </button>
        <span style={{ fontWeight: 700 }}>Запис</span>
      </div>
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1612' }}>Запис не знайдено</div>
      </div>
    </div>
  )

  const isProject = entry.entryType === 'project'

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
      await updateEntry({
        id: entry._id,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await removeEntry({ id: entry._id })
    navigate('/app', { replace: true })
  }

  const statusColor = entry.status === 'open' ? '#22C55E' : entry.status === 'done' ? '#9A8060' : '#EF9F27'
  const statusLabel = entry.status === 'open' ? 'Активно' : entry.status === 'done' ? 'Виконано' : entry.status ?? 'Відкрито'

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', background: '#F5F4F1', minHeight: '100dvh' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F5F4F1', borderBottom: '1px solid #EDE8DF', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9A8060', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
          ← Назад
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1612' }}>{isProject ? 'Проєкт' : 'Запис'}</span>
        <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#EF9F27', fontWeight: 600, fontFamily: 'inherit' }}>
          Редагувати
        </button>
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {/* Main card */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '20px', border: '1.5px solid #EDE8DF', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {isProject && <span style={{ fontSize: 22 }}>📁</span>}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {entry.category ?? (isProject ? 'Проєкт' : 'Запис')}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
            </div>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1612', margin: '0 0 10px', lineHeight: 1.3 }}>
            {entry.title}
          </h1>

          {entry.description && (
            <p style={{ fontSize: 14, color: '#5A4A2E', lineHeight: 1.6, margin: '0 0 14px' }}>
              {entry.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, paddingTop: 14, borderTop: '1px solid #EDE8DF' }}>
            {entry.city && (
              <div>
                <div style={{ fontSize: 10, color: '#9A8060', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 2 }}>Місто</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612' }}>📍 {entry.city}</div>
              </div>
            )}
            {entry.budgetMin && entry.budgetMax ? (
              <div>
                <div style={{ fontSize: 10, color: '#9A8060', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 2 }}>Бюджет</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#EF9F27' }}>€{entry.budgetMin}–{entry.budgetMax}</div>
              </div>
            ) : null}
            {entry.intentType && (
              <div>
                <div style={{ fontSize: 10, color: '#9A8060', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 2 }}>Тип</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1612' }}>
                  {entry.intentType === 'seeking_service' ? '🔍 Шукаю послугу'
                    : entry.intentType === 'offering_service' ? '⚡ Пропоную послугу'
                    : entry.intentType === 'seeking_job' ? '💼 Шукаю роботу'
                    : '🪨 Шукаю матеріали'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proposals placeholder */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', border: '1.5px solid #EDE8DF', textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612', marginBottom: 4 }}>Шукаємо виконавців</div>
          <div style={{ fontSize: 13, color: '#9A8060' }}>Сповістимо коли хтось відгукнеться</div>
        </div>

        {/* Delete */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'transparent', border: '1.5px solid #FCA5A5', color: '#DC2626', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Видалити запис
          </button>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #FCA5A5' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1612', marginBottom: 12, textAlign: 'center' }}>Видалити цей запис?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F5F4F1', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#5A4A2E', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>Видалити</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setEditing(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 90, background: '#F5F4F1', borderRadius: '24px 24px 0 0', maxHeight: '92dvh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,.22)', padding: '20px 16px 48px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1C8B8', margin: '-8px auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1612', marginBottom: 16 }}>Редагувати</div>

            {[
              { label: 'Назва', value: title, set: setTitle, placeholder: 'Назва запису' },
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
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опис задачі..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, color: '#1A1612', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff', resize: 'none', minHeight: 80, lineHeight: 1.5 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[{ label: 'Бюджет від €', value: budgetMin, set: setBudgetMin }, { label: 'до €', value: budgetMax, set: setBudgetMax }].map(f => (
                <div key={f.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, color: '#1A1612', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#EF9F27' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#EDE8DF', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#5A4A2E', fontFamily: 'inherit' }}>Скасувати</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 14, background: '#EF9F27', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1A1612', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Зберігаємо…' : 'Зберегти →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
