import { action } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"

const SYSTEM_PROMPT = `Ти — AI-помічник платформи OTaska (маркетплейс послуг у Братиславі/Празі/Варшаві).
Користувач написав свій запит. ПЕРШЕ що ти маєш зробити — визначити ХТО ПИШЕ.

═══ ВИЗНАЧЕННЯ РОЛІ ═══

ВИКОНАВЕЦЬ (пропонує послуги або шукає підробіток) — якщо текст містить:
"роблю", "виконую", "пропоную", "можу зробити", "доступний", "надаю послуги", "шукаю замовників", "досвід X років", "займаюсь", "праця", "робота по вихідним", "нічні зміни", "підробіток", "бригадник", "разнорабочій", "будь які роботи", "різноробочий"
→ intentType = "offering_service" або "seeking_job" залежно від контексту
→ Питай про: місто, доступність/графік

ЗАМОВНИК (шукає послуги) — якщо текст містить:
"потрібен", "шукаю майстра", "знайти", "допоможіть", "треба зробити", "хочу замовити"
→ intentType = "seeking_service"
→ Питай про: деталі задачі, терміни, бюджет

ШУКАЄ РОБОТУ:
→ intentType = "seeking_job"

ШУКАЄ МАТЕРІАЛИ:
→ intentType = "seeking_material"

═══ КРИТИЧНО ВАЖЛИВО: ПРИЙМИ БУДЬ-ЯКУ ВІДПОВІДЬ ═══
- Якщо користувач відповідає "будь що", "будь які", "різне", "все підряд" — це ВАЛІДНА відповідь для різноробочого/бригадника. НЕ відмовляй, НЕ проси уточнень. Просто створи оголошення.
- "Бригадник" або "різноробочий" (в Центральній Європі — "бригаднік") — це окрема спеціальність: людина, яка виконує будь-яку фізичну роботу яку скажуть. Це не потребує специфікації.
- Якщо людина каже "праця по вихідним" або "можна з нічними змінами" — це достатньо для оголошення про пошук роботи/підробітку.
- Максимум 2 уточнюючих питання, потім ОБОВ'ЯЗКОВО видавай RESULT навіть з неповними даними.
- НІКОЛИ не повертай помилку чи відмову. Якщо не вистачає даних — вигадай розумні defaults.

═══ ПРАВИЛА РОЗМОВИ ═══
- Відповідай ТІЛЬКИ українською
- ОДНЕ питання за раз
- Chips: 2-4 варіанти відповіді, короткі
- Максимум 2 питання → потім RESULT
- НЕ питай виконавця про "яку площу ремонтувати" — він сам робить, не замовляє!
- Якщо вже є місто і хоча б одна деталь — відразу видавай RESULT

═══ ФОРМАТ ВІДПОВІДІ ═══

Питання:
{
  "type": "question",
  "message": "текст питання",
  "chips": ["варіант 1", "варіант 2", "варіант 3"]
}

Результат (після 1-2 питань АБО якщо вже достатньо інформації):
{
  "type": "result",
  "message": "Чудово! Ось твоє оголошення:",
  "summary": {
    "emoji": "💪",
    "category": "Різноробочий",
    "title": "Різноробочий · Братислава",
    "details": "праця по вихідним · нічні зміни можливі",
    "budgetMin": 80,
    "budgetMax": 200,
    "intentType": "seeking_job",
    "entryType": "on_demand"
  }
}

intentType: seeking_service | offering_service | seeking_material | seeking_job
entryType: on_demand | project | material

ВАЖЛИВО: Завжди повертай відповідь виключно у форматі JSON. Ніякого тексту поза JSON.`

export const chat = action({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
  },
  handler: async (_ctx, { messages }) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY not set")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`OpenAI ${response.status}: ${responseText}`)
    }

    let data: { choices: Array<{ message: { content: string } }> }
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error(`Invalid JSON from OpenAI: ${responseText.slice(0, 200)}`)
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error(`Empty response from OpenAI: ${responseText.slice(0, 200)}`)

    // Validate the content is valid JSON before returning
    try {
      JSON.parse(content)
    } catch {
      // If not JSON, wrap it
      return JSON.stringify({ type: "question", message: content, chips: [] })
    }

    return content
  },
})

// AI matching: given one entry, find relevant open entries from other users
export const findMatches = action({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const entry = await ctx.runQuery(api.entries.get, { id: entryId })
    if (!entry) return []

    const allOpen = await ctx.runQuery(api.entries.listOpen, {})
    const others = allOpen.filter((e: { _id: string; clientId: string }) => e._id !== entryId && e.clientId !== entry.clientId)
    if (others.length === 0) return []

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return []

    const entryDesc = `${entry.title}. ${entry.description ?? ''}. Місто: ${entry.city ?? 'невідомо'}. Категорія: ${entry.category ?? 'інше'}. Тип: ${entry.intentType}.`
    const candidatesText = others.slice(0, 30).map((o: { _id: string; title: string; description?: string; city?: string; category?: string; intentType: string }, i: number) =>
      `[${i}] id=${o._id} | ${o.title} | ${o.description ?? ''} | місто: ${o.city ?? '?'} | категорія: ${o.category ?? '?'} | тип: ${o.intentType}`
    ).join('\n')

    const prompt = `Ти — AI-матчер платформи OTaska. Твоя задача — знайти релевантні пропозиції для запису.

ЗАПИС КОРИСТУВАЧА:
${entryDesc}

КАНДИДАТИ (інші відкриті записи):
${candidatesText}

Знайди записи які є релевантними для цього запису. Релевантність визначається:
- Якщо один шукає послугу (seeking_service) → інший пропонує (offering_service) у тій самій сфері
- Якщо один шукає роботу (seeking_job) → інший шукає виконавця (seeking_service/offering_service)
- Схоже місто або загальні міста
- Схожа категорія або суміжна сфера

Поверни JSON масив індексів релевантних кандидатів (максимум 5), відсортованих за релевантністю:
{"matches": [0, 3, 7]}`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) return []
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) return []

    try {
      const parsed = JSON.parse(content) as { matches?: number[] }
      const indices: number[] = parsed.matches ?? []
      return indices.filter((i: number) => i >= 0 && i < others.length).map((i: number) => others[i])
    } catch {
      return []
    }
  },
})
