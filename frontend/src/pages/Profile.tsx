import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useAuthActions } from '@convex-dev/auth/react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const CATEGORIES = ['Електрика', 'Сантехніка', 'Ремонт', 'Малярство', 'Плитка', 'Теслярство', 'Прибирання', 'Переїзд', 'Ландшафт', 'Інше']
const SKILL_OPTIONS = ['Електрика', 'Сантехніка', 'Малярство', 'Штукатурка', 'Плитка', 'Теслярство', 'Зварювання', 'Гіпсокартон', 'Підлога', 'Покрівля', 'Прибирання', 'Переїзд', 'Ландшафт', 'Будівництво']

function UploadButton({ label, onUpload, small }: { label: string; onUpload: (file: File) => Promise<void>; small?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try { await onUpload(file) } finally { setLoading(false) }
    e.target.value = ''
  }
  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handle} />
      <button onClick={() => ref.current?.click()} disabled={loading}
        style={{ padding: small ? '5px 10px' : '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: small ? 11 : 12, fontWeight: 600, fontFamily: 'inherit' }}>
        {loading ? '⏳' : label}
      </button>
    </>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const data = useQuery(api.storage.getMyProfileFull)
  const updateProfile = useMutation(api.users.updateProfile)
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const saveAvatar = useMutation(api.storage.saveAvatar)
  const saveCover = useMutation(api.storage.saveCover)
  const addPortfolioItem = useMutation(api.storage.addPortfolioItem)
  const removePortfolioItem = useMutation(api.storage.removePortfolioItem)
  const updateCaption = useMutation(api.storage.updatePortfolioCaption)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [category, setCategory] = useState('')
  const [isProvider, setIsProvider] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [availability, setAvailability] = useState('')
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLegalForm, setCompanyLegalForm] = useState('')
  const [companyRegNumber, setCompanyRegNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [companyCountry, setCompanyCountry] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyIban, setCompanyIban] = useState('')
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')
  const portfolioRef = useRef<HTMLInputElement>(null)

  if (data === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #EF9F27', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const user = data?.user
  const profile = data?.profile
  const avatarUrl = data?.avatarUrl
  const coverUrl = data?.coverUrl
  const portfolioUrls = data?.portfolioUrls ?? []
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Користувач'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const openEdit = () => {
    setName(user?.name ?? '')
    setCity(profile?.city ?? '')
    setBio(profile?.bio ?? '')
    setCategory(profile?.category ?? '')
    setIsProvider(profile?.isProvider ?? false)
    setSkills(profile?.skills ?? [])
    setHourlyRate(profile?.hourlyRate ? String(profile.hourlyRate) : '')
    setPriceFrom(profile?.priceFrom ? String(profile.priceFrom) : '')
    setPriceTo(profile?.priceTo ? String(profile.priceTo) : '')
    setAvailability(profile?.availability ?? '')
    setIsCompany(profile?.isCompany ?? false)
    setCompanyName(profile?.companyName ?? '')
    setCompanyLegalForm(profile?.companyLegalForm ?? '')
    setCompanyRegNumber(profile?.companyRegNumber ?? '')
    setVatNumber(profile?.vatNumber ?? '')
    setCompanyCountry(profile?.companyCountry ?? '')
    setCompanyAddress(profile?.companyAddress ?? '')
    setCompanyWebsite(profile?.companyWebsite ?? '')
    setCompanyPhone(profile?.companyPhone ?? '')
    setCompanyIban(profile?.companyIban ?? '')
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: name || undefined,
        city: city || undefined,
        bio: bio || undefined,
        category: category || undefined,
        isProvider,
        skills: skills.length > 0 ? skills : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        priceTo: priceTo ? Number(priceTo) : undefined,
        availability: availability || undefined,
        isCompany,
        companyName: companyName || undefined,
        companyLegalForm: companyLegalForm || undefined,
        companyRegNumber: companyRegNumber || undefined,
        vatNumber: vatNumber || undefined,
        companyCountry: companyCountry || undefined,
        companyAddress: companyAddress || undefined,
        companyWebsite: companyWebsite || undefined,
        companyPhone: companyPhone || undefined,
        companyIban: companyIban || undefined,
      })
      setEditing(false)
    } finally { setSaving(false) }
  }

  const uploadFile = async (file: File): Promise<Id<'_storage'>> => {
    const url = await generateUploadUrl()
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
    const { storageId } = await res.json() as { storageId: Id<'_storage'> }
    return storageId
  }

  const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #EDE8DF', fontSize: 14, fontFamily: 'inherit', background: '#F9F9F9', outline: 'none', boxSizing: 'border-box', color: '#1A1612' }
  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#1A1612'; e.currentTarget.style.background = '#fff' }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.background = '#F9F9F9' }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 40 }}>

      {/* Cover */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: coverUrl ? undefined : 'linear-gradient(135deg, #1A1612 0%, #3D2E1E 60%, #EF9F27 100%)' }}>
        {coverUrl
          ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
              <div style={{ position: 'absolute', bottom: -60, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(239,159,39,.12)' }} />
            </>
        }
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <UploadButton label="📷 Обкладинка" onUpload={async f => { const id = await uploadFile(f); await saveCover({ storageId: id }) }} />
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', border: '3px solid #F2F2F7', overflow: 'hidden', background: 'linear-gradient(135deg,#1A1612 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#EF9F27', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: -4 }}>
              <UploadButton label="📷" onUpload={async f => { const id = await uploadFile(f); await saveAvatar({ storageId: id }) }} small />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            {profile?.isProvider && (
              <button onClick={() => navigate(`/app/users/${user?._id}`)}
                style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#5A4A2E', fontFamily: 'inherit' }}>
                👁 Мій профіль
              </button>
            )}
            <button onClick={openEdit}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: '#1A1612', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
              ✏️ Редагувати
            </button>
          </div>
        </div>

        {/* Info card — name + bio + stats in one block */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '18px', marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1.5px solid #EDE8DF' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Left: name + email + bio + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1612', letterSpacing: '-.4px' }}>{displayName}</div>
                {profile?.verified && (
                  <span title="Верифікований" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: '50%', background: '#EF9F27', color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>✓</span>
                )}
              </div>
              {user?.email && <div style={{ fontSize: 13, color: '#9A8060', marginBottom: 8 }}>{user.email}</div>}
              {profile?.isProvider && !profile?.verified && (
                <div style={{ fontSize: 12, color: '#9A8060', marginBottom: 8 }}>Профіль ще не верифіковано</div>
              )}
              {profile?.bio
                ? <p style={{ fontSize: 13, color: '#5A4A2E', lineHeight: 1.6, margin: '0 0 8px' }}>{profile.bio}</p>
                : <p style={{ fontSize: 13, color: '#C0B49A', fontStyle: 'italic', margin: '0 0 8px' }}>Додайте опис профілю</p>
              }
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile?.city && <span style={{ fontSize: 12, color: '#9A8060' }}>📍 {profile.city}</span>}
                {profile?.category && <span style={{ fontSize: 12, color: '#9A8060' }}>🔧 {profile.category}</span>}
                {profile?.availability && <span style={{ fontSize: 12, color: '#9A8060' }}>🕐 {profile.availability}</span>}
              </div>
            </div>

            {/* Right: stats (only for providers) */}
            {profile?.isProvider && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, borderLeft: '1px solid #F0EBE3', paddingLeft: 14 }}>
                {[
                  { val: profile.rating > 0 ? profile.rating.toFixed(1) : '—', label: 'Рейтинг' },
                  { val: String(profile.jobsCompleted), label: 'Замовлень' },
                  { val: profile.priceFrom && profile.priceTo ? `€${profile.priceFrom}–${profile.priceTo}` : profile.hourlyRate ? `€${profile.hourlyRate}/год` : '—', label: 'Ціна' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1612', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#9A8060', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {(profile?.skills ?? []).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(profile?.skills ?? []).map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: '#fff', color: '#1A1612', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1.5px solid #EDE8DF' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1 }}>Портфоліо</div>
            <button onClick={() => portfolioRef.current?.click()}
              style={{ padding: '5px 14px', borderRadius: 99, border: 'none', background: '#1A1612', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Додати
            </button>
            <input ref={portfolioRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const id = await uploadFile(f); await addPortfolioItem({ storageId: id }); e.target.value = '' }} />
          </div>

          {portfolioUrls.length === 0 ? (
            <button onClick={() => portfolioRef.current?.click()}
              style={{ width: '100%', padding: '32px 16px', borderRadius: 16, border: '2px dashed #EDE8DF', background: '#fff', cursor: 'pointer', color: '#9A8060', fontSize: 14, fontFamily: 'inherit' }}>
              📷 Додайте фото своїх робіт
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, borderRadius: 16, overflow: 'hidden' }}>
              {portfolioUrls.map(item => (
                <div key={item.storageId} style={{ position: 'relative', aspectRatio: '1' }}>
                  <img src={item.url ?? ''} alt={item.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {editingCaption === item.storageId ? (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', flexDirection: 'column', padding: 8, gap: 6 }}>
                      <input autoFocus value={captionText} onChange={e => setCaptionText(e.target.value)}
                        style={{ flex: 1, border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} placeholder="Підпис..." />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={async () => { await updateCaption({ storageId: item.storageId, caption: captionText }); setEditingCaption(null) }}
                          style={{ flex: 1, padding: 4, borderRadius: 6, border: 'none', background: '#EF9F27', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                        <button onClick={() => setEditingCaption(null)}
                          style={{ flex: 1, padding: 4, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity .15s', background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                    >
                      <button onClick={() => { setEditingCaption(item.storageId); setCaptionText(item.caption ?? '') }}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Підпис</button>
                      <button onClick={() => removePortfolioItem({ storageId: item.storageId })}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,.7)', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Видалити</button>
                    </div>
                  )}
                  {item.caption && editingCaption !== item.storageId && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.7))', padding: '12px 6px 5px', fontSize: 10, color: '#fff', lineHeight: 1.3 }}>
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#9A8060', marginBottom: 8 }}>Мова</div>
          <LanguageSwitcher />
        </div>

        {/* Sign out */}
        <button onClick={() => signOut()}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #EDE8DF', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#DC2626', fontFamily: 'inherit', marginTop: 8 }}>
          Вийти з акаунту
        </button>
      </div>

      {/* Edit sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setEditing(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto', background: '#F9F9F9', borderRadius: '24px 24px 0 0', maxHeight: '92dvh', overflowY: 'auto', zIndex: 90, boxShadow: '0 -8px 48px rgba(0,0,0,.22)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1D1D6', margin: '12px auto 0' }} />
            <div style={{ padding: '16px 20px 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1A1612' }}>Редагувати профіль</h2>
                <button onClick={() => setEditing(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(118,118,128,.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11" /></svg>
                </button>
              </div>

              {[{ label: "Ім'я", val: name, set: setName, ph: "Ваше ім'я" }, { label: 'Місто', val: city, set: setCity, ph: 'Братислава' }].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#1A1612' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1A1612' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Опис</div>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Розкажіть про себе та свій досвід..." rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'none', color: '#1A1612', lineHeight: 1.5 }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1A1612' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8DF' }}
                />
              </div>

              {/* Provider toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, border: '1.5px solid #EDE8DF' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1612' }}>Я виконавець</div>
                  <div style={{ fontSize: 12, color: '#9A8060' }}>Показувати мій профіль замовникам</div>
                </div>
                <div onClick={() => setIsProvider(p => !p)} style={{ width: 50, height: 28, borderRadius: 99, background: isProvider ? '#EF9F27' : '#E5E5EA', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: isProvider ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>

              {isProvider && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Категорія</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)}
                          style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${category === c ? '#1A1612' : '#EDE8DF'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: category === c ? '#1A1612' : '#fff', color: category === c ? '#fff' : '#5A4A2E' }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {SKILL_OPTIONS.map(s => (
                        <button key={s} onClick={() => toggleSkill(s)}
                          style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${skills.includes(s) ? '#EF9F27' : '#EDE8DF'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: skills.includes(s) ? '#EF9F27' : '#fff', color: skills.includes(s) ? '#fff' : '#5A4A2E' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ціна (€)</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      {[{ label: 'Від', val: priceFrom, set: setPriceFrom }, { label: 'До', val: priceTo, set: setPriceTo }].map(f => (
                        <div key={f.label} style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>{f.label}</div>
                          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#1A1612' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Або ставка за годину</div>
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="€/год"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#1A1612' }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Доступність</div>
                    <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Наприклад: Пн–Пт, 9:00–18:00"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EDE8DF', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#1A1612' }} />
                  </div>
                </>
              )}

              {/* Company toggle */}
              <div style={{ height: 1, background: '#EDE8DF', margin: '4px 0 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, border: '1.5px solid #EDE8DF' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1612' }}>🏢 У мене є фірма</div>
                  <div style={{ fontSize: 12, color: '#9A8060' }}>Додати реквізити компанії</div>
                </div>
                <div onClick={() => setIsCompany(p => !p)} style={{ width: 50, height: 28, borderRadius: 99, background: isCompany ? '#EF9F27' : '#E5E5EA', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: isCompany ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>

              {isCompany && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #EDE8DF', padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Дані компанії</div>

                  {/* Company name + legal form */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Назва компанії</div>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Construction"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Правова форма</div>
                      <input value={companyLegalForm} onChange={e => setCompanyLegalForm(e.target.value)} placeholder="s.r.o. / GmbH"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* Reg number + VAT */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>IČO / Reg. number</div>
                      <input value={companyRegNumber} onChange={e => setCompanyRegNumber(e.target.value)} placeholder="12345678"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>IČ DPH / VAT ID</div>
                      <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="SK1234567890"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* Country + address */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Країна реєстрації</div>
                    <input value={companyCountry} onChange={e => setCompanyCountry(e.target.value)} placeholder="Словаччина"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Юридична адреса</div>
                    <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="вул. Головна 1, Братислава, 81101"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>

                  {/* Website + phone */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Сайт</div>
                      <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="acme.sk"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>Телефон компанії</div>
                      <input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+421 900 000 000"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* IBAN */}
                  <div>
                    <div style={{ fontSize: 11, color: '#9A8060', marginBottom: 4 }}>IBAN</div>
                    <input value={companyIban} onChange={e => setCompanyIban(e.target.value)} placeholder="SK00 0000 0000 0000 0000 0000"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>

                  <div style={{ fontSize: 11, color: '#C0B49A', marginTop: 12, lineHeight: 1.5 }}>
                    * Всі поля необов'язкові. Дані видно лише вам та замовникам при укладанні договору.
                  </div>
                </div>
              )}

              <button onClick={save} disabled={saving}
                style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: '#1A1612', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Зберігаємо...' : '✓ Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
