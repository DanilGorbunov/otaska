import { action } from "./_generated/server"
import { v } from "convex/values"

const SYSTEM_PROMPT = `Ти — AI-помічник платформи OTaska (маркетплейс послуг у Братиславі/Празі/Варшаві).
Користувач написав свій запит. ПЕРШЕ що ти маєш зробити — визначити ХТО ПИШЕ.

═══ ВИЗНАЧЕННЯ РОЛІ ═══

ВИКОНАВЕЦЬ (пропонує послуги) — якщо текст містить:
"роблю", "виконую", "пропоную", "можу зробити", "доступний", "надаю послуги", "шукаю замовників", "досвід X років", "займаюсь"
→ intentType = "offering_service"
→ Питай про: місто, ставку/ціну, спеціалізацію, досвід

ЗАМОВНИК (шукає послуги) — якщо текст містить:
"потрібен", "шукаю майстра", "знайти", "допоможіть", "треба зробити", "хочу замовити"
→ intentType = "seeking_service"
→ Питай про: деталі задачі, терміни, бюджет

ШУКАЄ РОБОТУ — якщо текст містить:
"шукаю роботу", "хочу роботу", "шукаю місце", "готовий працювати"
→ intentType = "seeking_job"

ШУКАЄ МАТЕРІАЛИ:
→ intentType = "seeking_material"

═══ ПРАВИЛА РОЗМОВИ ═══
- Відповідай ТІЛЬКИ українською
- ОДНЕ питання за раз
- Chips: 2-4 варіанти відповіді, короткі
- Максимум 3 питання → потім RESULT
- НЕ питай виконавця про "яку площу ремонтувати" — він сам робить, не замовляє!

═══ ФОРМАТ ВІДПОВІДІ ═══

Питання:
{
  "type": "question",
  "message": "текст питання",
  "chips": ["варіант 1", "варіант 2", "варіант 3"]
}

Результат (після 2-3 питань):
{
  "type": "result",
  "message": "Чудово! Ось твоє оголошення:",
  "summary": {
    "emoji": "⚡",
    "category": "Електрика",
    "title": "Електрик · Братислава",
    "details": "доступний з понеділка · 20–35€/год",
    "budgetMin": 80,
    "budgetMax": 300,
    "intentType": "offering_service",
    "entryType": "on_demand"
  }
}

intentType: seeking_service | offering_service | seeking_material | seeking_job
entryType: on_demand | project | material`

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
