export const CATEGORIES = ['Всі', 'Електрика', 'Сантехніка', 'Ремонт', 'Фарбування', 'Плитка', 'Теслярство', 'Матеріали', 'Переїзд', 'Інше']

// Broader taxonomy beyond construction — grouped for expandable filter UI (Phase 6)
export const CATEGORY_GROUPS: Array<{ group: string; label: string; categories: string[] }> = [
  { group: 'construction', label: 'Будівництво', categories: ['Електрика', 'Сантехніка', 'Ремонт', 'Фарбування', 'Плитка', 'Теслярство', 'Матеріали'] },
  { group: 'home', label: 'Дім', categories: ['Прибирання', 'Переїзд', 'Ландшафт'] },
  { group: 'education', label: 'Освіта', categories: ['Репетиторство'] },
  { group: 'tech', label: 'ІТ', categories: ['ІТ/техпідтримка'] },
  { group: 'events', label: 'Події', categories: ['Організація подій'] },
  { group: 'beauty', label: 'Краса', categories: ['Краса/здоров\'я'] },
  { group: 'pets', label: 'Тварини', categories: ['Догляд за тваринами'] },
  { group: 'auto', label: 'Авто', categories: ['Авто'] },
  { group: 'other', label: 'Інше', categories: ['Інше'] },
]

export const INTENT_TYPES = ['seeking_service', 'offering_service', 'seeking_job', 'seeking_material'] as const

export const INTENT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  seeking_service:  { label: 'Шукає виконавця', color: '#5A3E22', bg: 'rgba(239,159,39,.14)' },
  offering_service: { label: 'Пропонує послугу', color: '#2D5A27', bg: 'rgba(34,197,94,.13)' },
  seeking_job:      { label: 'Шукає роботу',     color: '#4A3060', bg: 'rgba(139,92,246,.12)' },
  seeking_material: { label: 'Шукає матеріали',  color: '#5A4A2E', bg: 'rgba(154,128,96,.15)' },
}
