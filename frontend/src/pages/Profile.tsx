import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useAction } from 'convex/react'
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
  const createOnboardingLink = useAction(api.payments.createProviderOnboardingLink)
  const [connectingPayouts, setConnectingPayouts] = useState(false)
  const [connectError, setConnectError] = useState('')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [category, setCategory] = useState('')
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
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
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
  const isPerformer = (profile?.skills?.length ?? 0) > 0

  const openEdit = () => {
    setName(user?.name ?? '')
    setCity(profile?.city ?? '')
    setBio(profile?.bio ?? '')
    setCategory(profile?.category ?? '')
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

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg-field)', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }
  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.background = '#fff' }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-field)' }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100dvh', paddingBottom: 40 }}>

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'var(--bg-page-blur)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--hairline)',
      }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.4px' }}>Профіль</span>
        </div>
      </div>

      {/* Cover */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: coverUrl ? undefined : 'linear-gradient(135deg, var(--text-primary) 0%, #3D2E1E 60%, var(--accent) 100%)' }}>
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
            <div style={{ width: 88, height: 88, borderRadius: '50%', border: '3px solid var(--bg-page)', overflow: 'hidden', background: 'linear-gradient(135deg,var(--text-primary) 0%,#5A3E22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'var(--accent)', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: -4 }}>
              <UploadButton label="📷" onUpload={async f => { const id = await uploadFile(f); await saveAvatar({ storageId: id }) }} small />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            {isPerformer && (
              <button onClick={() => navigate(`/app/users/${user?._id}`)}
                style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                👁 Мій профіль
              </button>
            )}
            <button onClick={openEdit}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
              ✏️ Редагувати
            </button>
          </div>
        </div>

        {/* Info card — name + bio + stats in one block */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Left: name + email + bio + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.4px' }}>{displayName}</div>
                {profile?.verified && (
                  <span title="Верифікований" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>✓</span>
                )}
              </div>
              {user?.email && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{user.email}</div>}
              {isPerformer && !profile?.verified && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Профіль ще не верифіковано</div>
              )}
              {profile?.bio
                ? <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, margin: '0 0 8px' }}>{profile.bio}</p>
                : <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', margin: '0 0 8px' }}>Додайте опис профілю</p>
              }
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile?.city && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {profile.city}</span>}
                {profile?.category && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🔧 {profile.category}</span>}
                {profile?.availability && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🕐 {profile.availability}</span>}
              </div>
            </div>

            {/* Right: stats (once skills are filled in) */}
            {isPerformer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
                {[
                  { val: profile?.rating && profile.rating > 0 ? profile.rating.toFixed(1) : '—', label: 'Рейтинг' },
                  { val: String(profile?.jobsCompleted ?? 0), label: 'Замовлень' },
                  { val: profile?.priceFrom && profile?.priceTo ? `€${profile.priceFrom}–${profile.priceTo}` : profile?.hourlyRate ? `€${profile.hourlyRate}/год` : '—', label: 'Ціна' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {(profile?.skills ?? []).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(profile?.skills ?? []).map(s => (
                <span key={s} style={{ padding: '7px 14px', borderRadius: 99, background: '#fff', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1.5px solid var(--border)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Payouts — connects a Stripe Express account so escrow can pay this performer out */}
        {isPerformer && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12, border: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {profile?.stripeOnboarded ? '✅ Виплати підключено' : '💳 Підключити виплати'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Потрібно, щоб отримувати оплату за виконані задачі</div>
              </div>
              {!profile?.stripeOnboarded && (
                <button disabled={connectingPayouts} onClick={async () => {
                  setConnectingPayouts(true); setConnectError('')
                  try {
                    const { url } = await createOnboardingLink({
                      returnUrl: window.location.href,
                      refreshUrl: window.location.href,
                    })
                    window.location.href = url
                  } catch (e) {
                    const raw = (e as Error)?.message ?? ''
                    const clean = raw.match(/Uncaught Error: (.+?)(?:\s+at\s|$)/)?.[1] ?? raw
                    setConnectError(clean.includes('STRIPE_SECRET_KEY') ? 'Виплати ще не налаштовані на платформі. Спробуй пізніше.' : (clean || 'Помилка підключення'))
                  } finally {
                    setConnectingPayouts(false)
                  }
                }} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
                  {connectingPayouts ? '...' : 'Підключити'}
                </button>
              )}
            </div>
            {connectError && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{connectError}</div>}
          </div>
        )}

        {/* Portfolio */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Портфоліо</div>
            <button onClick={() => portfolioRef.current?.click()}
              style={{ padding: '5px 14px', borderRadius: 99, border: 'none', background: 'var(--text-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Додати
            </button>
            <input ref={portfolioRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const id = await uploadFile(f); await addPortfolioItem({ storageId: id }); e.target.value = '' }} />
          </div>

          {portfolioUrls.length === 0 ? (
            <button onClick={() => portfolioRef.current?.click()}
              style={{ width: '100%', padding: '32px 16px', borderRadius: 16, border: '2px dashed var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'inherit' }}>
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
                          style={{ flex: 1, padding: 4, borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Мова</div>
          <LanguageSwitcher />
        </div>

        {/* Sign out */}
        <button onClick={() => signOut()}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--danger)', fontFamily: 'inherit', marginTop: 8 }}>
          Вийти з акаунту
        </button>
      </div>

      {/* Edit sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }} onClick={() => setEditing(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto', background: 'var(--bg-field)', borderRadius: '24px 24px 0 0', maxHeight: '92dvh', overflowY: 'auto', zIndex: 90, boxShadow: '0 -8px 48px rgba(0,0,0,.22)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: '12px auto 0' }} />
            <div style={{ padding: '16px 20px 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Редагувати профіль</h2>
                <button onClick={() => setEditing(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(118,118,128,.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11" /></svg>
                </button>
              </div>

              {[{ label: "Ім'я", val: name, set: setName, ph: "Ваше ім'я" }, { label: 'Місто', val: city, set: setCity, ph: 'Братислава' }].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Опис</div>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Розкажіть про себе та свій досвід..." rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'none', color: 'var(--text-primary)', lineHeight: 1.5 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>

              {/* Skills — filling any in makes this profile discoverable as a performer, no toggle needed */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Навички та послуги</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>Додайте хоча б одну навичку, щоб клієнти могли знайти вас і надіслати задачу</div>
              </div>

              <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Категорія</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)}
                          style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${category === c ? 'var(--text-primary)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: category === c ? 'var(--text-primary)' : '#fff', color: category === c ? '#fff' : 'var(--text-tertiary)' }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Навички</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {SKILL_OPTIONS.map(s => (
                        <button key={s} onClick={() => toggleSkill(s)}
                          style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${skills.includes(s) ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: skills.includes(s) ? 'var(--accent)' : '#fff', color: skills.includes(s) ? '#fff' : 'var(--text-tertiary)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ціна (€)</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      {[{ label: 'Від', val: priceFrom, set: setPriceFrom }, { label: 'До', val: priceTo, set: setPriceTo }].map(f => (
                        <div key={f.label} style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{f.label}</div>
                          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Або ставка за годину</div>
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="€/год"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Доступність</div>
                    <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Наприклад: Пн–Пт, 9:00–18:00"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }} />
                  </div>
              </>

              {/* Company toggle */}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, border: '1.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>🏢 У мене є фірма</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Додати реквізити компанії</div>
                </div>
                <div onClick={() => setIsCompany(p => !p)} style={{ width: 50, height: 28, borderRadius: 99, background: isCompany ? 'var(--accent)' : 'var(--border-strong)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: isCompany ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>

              {isCompany && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Дані компанії</div>

                  {/* Company name + legal form */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Назва компанії</div>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Construction"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Правова форма</div>
                      <input value={companyLegalForm} onChange={e => setCompanyLegalForm(e.target.value)} placeholder="s.r.o. / GmbH"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* Reg number + VAT */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>IČO / Reg. number</div>
                      <input value={companyRegNumber} onChange={e => setCompanyRegNumber(e.target.value)} placeholder="12345678"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>IČ DPH / VAT ID</div>
                      <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="SK1234567890"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* Country + address */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Країна реєстрації</div>
                    <input value={companyCountry} onChange={e => setCompanyCountry(e.target.value)} placeholder="Словаччина"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Юридична адреса</div>
                    <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="вул. Головна 1, Братислава, 81101"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>

                  {/* Website + phone */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Сайт</div>
                      <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="acme.sk"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Телефон компанії</div>
                      <input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+421 900 000 000"
                        style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>

                  {/* IBAN */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>IBAN</div>
                    <input value={companyIban} onChange={e => setCompanyIban(e.target.value)} placeholder="SK00 0000 0000 0000 0000 0000"
                      style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.5 }}>
                    * Всі поля необов'язкові. Дані видно лише вам та замовникам при укладанні договору.
                  </div>
                </div>
              )}

              <button onClick={save} disabled={saving}
                style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'var(--text-primary)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Зберігаємо...' : '✓ Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
