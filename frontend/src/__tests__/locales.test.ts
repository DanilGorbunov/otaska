import { describe, it, expect } from 'vitest'
import en from '../locales/en/common.json'
import uk from '../locales/uk/common.json'

// A missing key silently falls back to showing the raw i18n path in the UI (e.g. "landing.chat.error")
// instead of throwing — this is the cheapest guardrail against that class of bug.
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k)
  )
}

describe('locale files', () => {
  it('en and uk expose the same set of translation keys', () => {
    const enKeys = collectKeys(en).sort()
    const ukKeys = collectKeys(uk).sort()

    const missingInUk = enKeys.filter(k => !ukKeys.includes(k))
    const missingInEn = ukKeys.filter(k => !enKeys.includes(k))

    expect(missingInUk, `keys present in en but missing in uk: ${missingInUk.join(', ')}`).toEqual([])
    expect(missingInEn, `keys present in uk but missing in en: ${missingInEn.join(', ')}`).toEqual([])
  })
})
