import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import uk from '../locales/uk/common.json'
import sk from '../locales/sk/common.json'
import cs from '../locales/cs/common.json'
import pl from '../locales/pl/common.json'
import ru from '../locales/ru/common.json'
import en from '../locales/en/common.json'

export const SUPPORTED_LOCALES = [
  { code: 'uk', label: 'Українська' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'cs', label: 'Čeština' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const

const LOCALE_STORAGE_KEY = 'otaska_locale'

function detectLocale(): string {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) return saved
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    uk: { common: uk },
    sk: { common: sk },
    cs: { common: cs },
    pl: { common: pl },
    ru: { common: ru },
    en: { common: en },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, lng)
})

export default i18n
