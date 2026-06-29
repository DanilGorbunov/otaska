import { action } from "./_generated/server"
import { v } from "convex/values"

const SYSTEM_PROMPT = `Ти — AI-помічник платформи OTaska (маркетплейс послуг у Братиславі/Празі/Варшаві).
Користувач написав свій запит довільним текстом. Твоя задача — уточнити деталі через коротку розмову.

ПРАВИЛА:
- Відповідай ТІЛЬКИ українською
- Задавай ОДНЕ питання за раз
- До питання додавай масив chips (варіанти відповіді) — 2-4 коротких варіанти
- Максимум 3 питання, потім повертай RESULT
- Питання мають бути корисними: коли потрібно, бюджет, деталі роботи

ФОРМАТ відповіді — завжди JSON:
{
  "type": "question",
  "message": "текст питання",
  "chips": ["варіант 1", "варіант 2", "варіант 3"]
}

Або коли вже достатньо інформації (після 2-3 питань):
{
  "type": "result",
  "message": "Чудово, все зрозуміло! Ось що вийшло:",
  "summary": {
    "emoji": "🏗️",
    "category": "Ремонт",
    "title": "Ремонт квартири · Братислава",
    "details": "20€/год · цього тижня · 2 кімнати",
    "budgetMin": 500,
    "budgetMax": 3000,
    "intentType": "seeking_service",
    "entryType": "on_demand"
  }
}

intentType може бути: seeking_service | offering_service | seeking_material | seeking_job
entryType може бути: on_demand | project | material`

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

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    return data.choices[0].message.content
  },
})
