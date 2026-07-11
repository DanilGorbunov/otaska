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

function detectLocale(): string {
  const browserLang = navigator.language.slice(0, 2)
  return SUPPORTED_LOCALES.some(l => l.code === browserLang) ? browserLang : 'uk'
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
  fallbackLng: 'uk',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n
