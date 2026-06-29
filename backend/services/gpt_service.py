import json
import logging
from openai import OpenAI
from config import settings

logger = logging.getLogger(__name__)
client = OpenAI(api_key=settings.mutask_api_gpt)


async def project_assistant(user_message: str, context: dict) -> str:
    """GPT-4 project management assistant — helps users manage entries, plan work, suggest next steps."""
    logger.info(f"[GPT] project_assistant: msg={user_message[:80]!r}")
    system = f"""You are OTaska's smart project assistant for the Central European construction marketplace.
You help users manage construction projects, plan tasks, find contractors, and estimate costs.
Context about current user:
- Name: {context.get('name', 'User')}
- City: {context.get('city', 'Bratislava')}
- Active entries: {context.get('active_entries', 0)}
- Projects: {context.get('projects', 0)}

Be concise, practical, and answer in the same language the user writes in (Ukrainian, Slovak, Czech, English).
If asked about prices, use real CEE market rates (EUR).
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
        max_tokens=400,
        temperature=0.7,
    )
    result = response.choices[0].message.content
    logger.info(f"[GPT] project_assistant response: {result[:100]!r}")
    return result


async def smart_description_enhance(title: str, category: str, city: str) -> str:
    """GPT generates a professional description for an entry based on title + category."""
    logger.info(f"[GPT] smart_description_enhance: {title!r} / {category}")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Write a professional, concise job posting description (2-3 sentences) for:
Title: {title}
Category: {category}
City: {city}
Write in the same style as a real job posting. Be specific about what's needed.
Output only the description text, no labels."""
        }],
        max_tokens=150,
        temperature=0.6,
    )
    return response.choices[0].message.content.strip()


async def price_negotiation_advice(entry_title: str, proposals: list, city: str) -> dict:
    """GPT analyzes proposals and advises which one is best value."""
    logger.info(f"[GPT] price_negotiation_advice: {entry_title!r}, {len(proposals)} proposals")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""You are a construction market expert in {city}.
Job: {entry_title}
Proposals received: {json.dumps(proposals)}

Analyze the proposals and return ONLY valid JSON:
{{
  "best_value_id": "proposal_id or null",
  "reasoning": "1 sentence",
  "market_fair_price": number,
  "tip": "1 actionable tip for the client"
}}"""
        }],
        max_tokens=200,
    )
    return json.loads(response.choices[0].message.content)
