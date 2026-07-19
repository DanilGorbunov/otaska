import { useTranslation } from 'react-i18next'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SUPPORTED_LOCALES } from '../lib/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const updateProfile = useMutation(api.users.updateProfile)

  const setLocale = (code: string) => {
    i18n.changeLanguage(code)
    updateProfile({ locale: code }).catch(() => { /* best-effort; UI already switched */ })
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SUPPORTED_LOCALES.map(l => (
        <button key={l.code} onClick={() => setLocale(l.code)} style={{
          padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
          background: i18n.language === l.code ? 'var(--text-primary)' : '#fff',
          color: i18n.language === l.code ? '#fff' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          boxShadow: i18n.language === l.code ? '0 2px 8px rgba(0,0,0,.2)' : '0 1px 4px rgba(0,0,0,.07)',
        }}>
          {l.label}
        </button>
      ))}
    </div>
  )
}
