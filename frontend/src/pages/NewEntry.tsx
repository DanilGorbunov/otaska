import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useAction, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { compressImage } from '../lib/image'

type ParsedTask = {
  title: string
  type: 'service' | 'material'
  intentType: string
  selected: boolean
}

type ParsedProject = {
  projectTitle: string
  projectCity: string
  tasks: ParsedTask[]
}

// Sub-component: shows provider search indicator for one task
function TaskProviderIndicator({ taskTitle, city }: { taskTitle: string; city: string }) {
  const results = useQuery(api.users.searchProvidersForTask, { taskTitle, city: city || undefined })

  if (results === undefined) {
    return <span style={{ fontSize: 11, color: 'var(--accent)' }}>🟡 Шукаємо...</span>
  }
  if (results.length === 0) {
    return <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Немає майстрів — опублікуємо запит</span>
  }
  return (
    <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
      ✅ Знайдено {results.length} {results.length === 1 ? 'майстра' : 'майстри'}
    </span>
  )
}

export function NewEntry() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const me = useQuery(api.users.getMe)
  const myCity = me?.profile?.city ?? ''
  const createAndPublish = useMutation(api.entries.createAndPublish)
  const createDraft = useMutation(api.entries.create)
  const createTask = useMutation(api.entries.createTask)
  const parseProjectFull = useAction(api.ai.parseProjectFull)
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const diagnosePhoto = useAction(api.ai.diagnosePhoto)

  const [mode, setMode] = useState<'entry' | 'project' | 'photo'>('entry')

  // Photo mode
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoStorageId, setPhotoStorageId] = useState<Id<'_storage'> | null>(null)
  const [diagnosis, setDiagnosis] = useState<{ category: string; urgency: string; priceMin: number; priceMax: number } | null>(null)
  const [diagnosing, setDiagnosing] = useState(false)

  // Entry mode
  const [text, setText] = useState('')
  const [entryPhotoPreview, setEntryPhotoPreview] = useState<string | null>(null)
  const [entryPhotoStorageId, setEntryPhotoStorageId] = useState<Id<'_storage'> | null>(null)
  const [entryPhotoUploading, setEntryPhotoUploading] = useState(false)

  // Project mode — step 1
  const [projectTitle, setProjectTitle] = useState('')
  const [projectCity, setProjectCity] = useState('')
  const [projectText, setProjectText] = useState('')
  const [parsing, setParsing] = useState(false)

  // Project mode — step 2 (confirmation)
  const [parsed, setParsed] = useState<ParsedProject | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleParseProject = async () => {
    const text = projectText.trim()
    if (!text) return
    setParsing(true)
    setError('')
    try {
      const result = await parseProjectFull({ text, locale: i18n.language }) as { projectTitle: string; projectCity: string; tasks: Array<{ title: string; type: 'service' | 'material'; intentType: string }> }
      setParsed({
        projectTitle: projectTitle.trim() || result.projectTitle,
        projectCity: projectCity.trim() || result.projectCity,
        tasks: result.tasks.map(t => ({ ...t, selected: true })),
      })
    } catch (e) {
      const msg = (e as Error)?.message ?? ''
      setError(msg.includes('OPENAI_API_KEY') || msg.includes('Server Error')
        ? 'AI недоступний. Перевірте OPENAI_API_KEY у Convex Dashboard → Settings → Environment Variables.'
        : msg || 'Помилка AI')
    } finally {
      setParsing(false)
    }
  }

  const handleEntrySubmit = async (draft = false) => {
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const args = { title: text.slice(0, 80), description: text, intentType: 'seeking_service' as const, entryType: 'on_demand' as const, category: 'Інше', city: myCity || undefined, budgetMin: 0, budgetMax: 0, photoStorageId: entryPhotoStorageId ?? undefined }
      if (draft) await createDraft(args)
      else await createAndPublish(args)
      navigate(-1)
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Помилка')
      setSubmitting(false)
    }
  }

  const handleProjectCreate = async () => {
    if (!parsed) return
    setSubmitting(true)
    setError('')
    try {
      const projectId = await createAndPublish({
        title: parsed.projectTitle,
        description: parsed.projectTitle,
        intentType: 'seeking_service',
        entryType: 'project',
        category: 'Проєкт',
        city: parsed.projectCity || myCity || undefined,
        budgetMin: 0,
        budgetMax: 0,
      }) as Id<'entries'>

      for (const t of parsed.tasks.filter(t => t.selected)) {
        await createTask({
          projectId,
          title: t.title,
          intentType: (t.intentType as 'seeking_service' | 'offering_service' | 'seeking_material' | 'seeking_job') || 'seeking_service',
        })
      }
      navigate(-1)
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Помилка')
      setSubmitting(false)
    }
  }

  const handleEntryPhotoSelect = async (file: File) => {
    setEntryPhotoUploading(true)
    try {
      const compressed = await compressImage(file, 'task')
      setEntryPhotoPreview(URL.createObjectURL(compressed))
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': compressed.type }, body: compressed })
      const { storageId } = await res.json() as { storageId: Id<'_storage'> }
      setEntryPhotoStorageId(storageId)
    } catch (e) {
      setError((e as Error)?.message ?? 'Помилка завантаження фото')
    } finally {
      setEntryPhotoUploading(false)
    }
  }

  const handlePhotoSelect = async (file: File) => {
    setDiagnosis(null)
    setError('')
    setDiagnosing(true)
    try {
      const compressed = await compressImage(file, 'task')
      setPhotoPreview(URL.createObjectURL(compressed))
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': compressed.type }, body: compressed })
      const { storageId } = await res.json() as { storageId: Id<'_storage'> }
      setPhotoStorageId(storageId)
      const result = await diagnosePhoto({ storageId, locale: i18n.language })
      setDiagnosis(result)
    } catch (e) {
      setError((e as Error)?.message ?? 'Помилка діагностики фото')
    } finally {
      setDiagnosing(false)
    }
  }

  const handlePhotoSubmit = async () => {
    if (!diagnosis) return
    setSubmitting(true)
    setError('')
    try {
      await createAndPublish({
        title: `${diagnosis.category} · фото-діагностика`,
        description: 'Створено з фото через AI-діагностику',
        intentType: 'seeking_service',
        entryType: 'on_demand',
        category: diagnosis.category,
        city: myCity || undefined,
        budgetMin: diagnosis.priceMin,
        budgetMax: diagnosis.priceMax,
        urgency: diagnosis.urgency,
        photoStorageId: photoStorageId ?? undefined,
        aiDiagnosis: diagnosis,
      })
      navigate(-1)
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Помилка')
      setSubmitting(false)
    }
  }

  const toggleTask = (i: number) => {
    setParsed(prev => prev ? { ...prev, tasks: prev.tasks.map((t, j) => j === i ? { ...t, selected: !t.selected } : t) } : prev)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }}
        onClick={() => navigate(-1)} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 430, zIndex: 90,
        background: 'var(--bg-field)', borderRadius: '24px 24px 0 0',
        maxHeight: '92dvh', overflowY: 'auto',
        boxShadow: '0 -8px 48px rgba(0,0,0,.22)',
        animation: 'sheetUp 0.34s cubic-bezier(0.25,0.46,0.45,0.94) both',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: '12px auto 0' }} />

        <div style={{ padding: '16px 16px 48px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {parsed ? (parsed.projectTitle || 'Проєкт') : mode === 'project' ? 'Новий проєкт' : 'Новий запис'}
            </h2>
            <button onClick={() => { if (parsed) { setParsed(null) } else navigate(-1) }} style={{
              background: 'rgba(118,118,128,.15)', border: 'none', cursor: 'pointer',
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {parsed
                ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                : <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11" /></svg>
              }
            </button>
          </div>

          {/* Mode tabs — only in step 1 */}
          {!parsed && (
            <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(118,118,128,.12)', borderRadius: 9, marginBottom: 16 }}>
              {(['entry', 'project', 'photo'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
                  transition: 'all .15s',
                }}>
                  {m === 'entry' ? 'Запис' : m === 'project' ? 'Проєкт' : '📷 Фото'}
                </button>
              ))}
            </div>
          )}

          {/* ── ENTRY MODE ── */}
          {mode === 'entry' && !parsed && (
            <>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 12, border: text.length > 0 ? '1.5px solid var(--dark)' : '1.5px solid transparent', transition: 'border-color .2s', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <textarea
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={"Напиши що тобі потрібно або що ти пропонуєш...\n\nНаприклад: «потрібен електрик на п'ятницю» або «роблю сантехніку в Братиславі»"}
                  style={{ width: '100%', minHeight: 110, border: 'none', outline: 'none', resize: 'none', fontSize: 16, lineHeight: 1.55, color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 12, color: 'var(--border-strong)', marginTop: 6 }}>{text.length}/500</div>
              </div>

              {entryPhotoPreview && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img src={entryPhotoPreview} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 14 }} />
                  <button onClick={() => { setEntryPhotoPreview(null); setEntryPhotoStorageId(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                    ✕
                  </button>
                </div>
              )}
              <label style={{ display: 'block', marginBottom: 10 }}>
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleEntryPhotoSelect(f) }} />
                <div style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', background: '#fff' }}>
                  {entryPhotoUploading ? '⏳ Завантажуємо...' : entryPhotoPreview ? '📷 Змінити фото' : '📷 Додати фото (необов\'язково)'}
                </div>
              </label>

              {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <button onClick={() => navigate(-1)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                  Скасувати
                </button>
                <button onClick={() => handleEntrySubmit(false)} disabled={!text.trim() || submitting || entryPhotoUploading}
                  style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed', background: text.trim() ? 'var(--dark)' : 'var(--border-strong)', fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                  {submitting ? 'Зберігаємо...' : 'Опублікувати →'}
                </button>
              </div>
              <button onClick={() => handleEntrySubmit(true)} disabled={!text.trim() || submitting || entryPhotoUploading}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--border)', cursor: text.trim() ? 'pointer' : 'not-allowed', background: '#fff', fontSize: 14, fontWeight: 500, color: text.trim() ? 'var(--text-tertiary)' : 'var(--border-strong)', fontFamily: 'inherit' }}>
                🔒 Зберегти як чернетку
              </button>
            </>
          )}

          {/* ── PHOTO MODE ── */}
          {mode === 'photo' && (
            <>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 12, border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 10 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13 }}>Сфотографуй проблему — протікання, тріщину, поламку</div>
                  </div>
                )}
                <label style={{ display: 'block' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f) }} />
                  <div style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid var(--border)', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {photoPreview ? 'Обрати інше фото' : 'Обрати фото'}
                  </div>
                </label>
              </div>

              {diagnosing && (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>✦ AI аналізує фото...</div>
              )}

              {diagnosis && (
                <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 12, border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Діагноз AI</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{diagnosis.category}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{diagnosis.urgency}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>€{diagnosis.priceMin}–{diagnosis.priceMax}</div>
                </div>
              )}

              {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate(-1)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                  Скасувати
                </button>
                <button onClick={handlePhotoSubmit} disabled={!diagnosis || submitting}
                  style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: diagnosis ? 'pointer' : 'not-allowed', background: diagnosis ? 'var(--dark)' : 'var(--border-strong)', fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                  {submitting ? 'Зберігаємо...' : 'Опублікувати →'}
                </button>
              </div>
            </>
          )}

          {/* ── PROJECT MODE STEP 1 — textarea ── */}
          {mode === 'project' && !parsed && (
            <>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1.5px solid var(--border)' }}>
                <input
                  autoFocus
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  placeholder="Назва проєкту"
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 17, fontWeight: 700, fontFamily: 'inherit', background: 'transparent', marginBottom: 10, boxSizing: 'border-box', color: 'var(--text-primary)' }}
                />
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', flexShrink: 0 }}>📍</span>
                  <input
                    value={projectCity}
                    onChange={e => setProjectCity(e.target.value)}
                    placeholder="Місто"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'transparent', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 12, border: projectText.length > 0 ? '1.5px solid var(--dark)' : '1.5px solid var(--border)', transition: 'border-color .2s', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <textarea
                  value={projectText}
                  onChange={e => setProjectText(e.target.value)}
                  placeholder={'Опишіть роботи та матеріали...\n\nНаприклад: «Малярні та штукатурні роботи, великий обсяг щебня та піску, сантехніка у роздягальнях»'}
                  style={{ width: '100%', minHeight: 110, border: 'none', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.55, color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate(-1)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(118,118,128,.12)', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                  Скасувати
                </button>
                <button onClick={handleParseProject} disabled={(!projectText.trim() && !projectTitle.trim()) || parsing}
                  style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', cursor: (projectText.trim() || projectTitle.trim()) ? 'pointer' : 'not-allowed', background: (projectText.trim() || projectTitle.trim()) ? 'var(--dark)' : 'var(--border-strong)', fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                  {parsing ? '✦ Аналізую...' : '✦ Далі →'}
                </button>
              </div>
            </>
          )}

          {/* ── PROJECT MODE STEP 2 — confirmation ── */}
          {parsed && (
            <>
              {/* Project info */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 16, border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Проєкт</div>
                <input value={parsed.projectTitle} onChange={e => setParsed(p => p ? { ...p, projectTitle: e.target.value } : p)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', background: 'transparent', marginBottom: 4, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍</span>
                  <input value={parsed.projectCity} onChange={e => setParsed(p => p ? { ...p, projectCity: e.target.value } : p)}
                    style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'inherit', background: 'transparent' }} />
                </div>
              </div>

              {/* Service tasks */}
              {parsed.tasks.filter(t => t.type === 'service').length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    🔍 Пошук виконавців
                  </div>
                  {parsed.tasks.map((t, i) => t.type !== 'service' ? null : (
                    <div key={i} onClick={() => toggleTask(i)}
                      style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: `1.5px solid ${t.selected ? 'var(--text-primary)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.selected ? 'var(--text-primary)' : 'var(--text-dim)'}`, background: t.selected ? 'var(--text-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {t.selected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{t.title}</div>
                        <TaskProviderIndicator taskTitle={t.title} city={parsed.projectCity} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Material tasks */}
              {parsed.tasks.filter(t => t.type === 'material').length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    📦 Пошук матеріалів
                  </div>
                  {parsed.tasks.map((t, i) => t.type !== 'material' ? null : (
                    <div key={i} onClick={() => toggleTask(i)}
                      style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: `1.5px solid ${t.selected ? 'var(--text-primary)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.selected ? 'var(--text-primary)' : 'var(--text-dim)'}`, background: t.selected ? 'var(--text-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {t.selected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{t.title}</div>
                        <TaskProviderIndicator taskTitle={t.title} city={parsed.projectCity} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}

              <button onClick={handleProjectCreate} disabled={submitting}
                style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--text-primary)', fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                {submitting ? 'Створюємо...' : `🚀 Створити проєкт + ${parsed.tasks.filter(t => t.selected).length} тасків`}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}
