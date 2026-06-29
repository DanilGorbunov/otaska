import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)
client = Anthropic(api_key=settings.anthropic_api_key)


async def categorize_entry(text: str, city: str = "Bratislava") -> dict:
    logger.info(f"[AI] categorize_entry: text={text[:80]!r}, city={city}")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"""Classify this construction marketplace entry.
Text: "{text}"
City: {city}

Return ONLY valid JSON, no explanation:
{{
  "intent_type": "seeking_service|seeking_material|offering_service|seeking_job",
  "category": "electric|plumbing|renovation|painting|tiling|carpentry|materials|labor|moving|other",
  "entry_type": "on_demand|project",
  "urgency": "low|medium|high",
  "title": "short title max 50 chars",
  "skills": ["skill1", "skill2"]
}}"""
        }]
    )
    result = json.loads(response.content[0].text)
    logger.info(f"[AI] categorize_entry result: {result}")
    return result


async def estimate_cost(text: str, city: str = "Bratislava") -> dict:
    logger.info(f"[AI] estimate_cost: text={text[:80]!r}, city={city}")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": f"""You are an expert in the Slovak/CEE construction market ({city}).
Task: "{text}"

Return ONLY valid JSON:
{{
  "min": number,
  "max": number,
  "currency": "EUR",
  "duration": "e.g. '2-4 hours' or '3-5 days'",
  "basis": "one sentence explanation"
}}"""
        }]
    )
    result = json.loads(response.content[0].text)
    logger.info(f"[AI] estimate_cost result: {result}")
    return result


async def match_providers(entry: dict, providers: list) -> list:
    logger.info(f"[AI] match_providers: entry_id={entry.get('id')}, providers={len(providers)}")
    if not providers:
        return []
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"""Entry: {json.dumps(entry)}
Available providers: {json.dumps(providers)}
Sort providers by relevance to the entry. Return ONLY a JSON array of provider ids in priority order:
["id1", "id2", "id3"]"""
        }]
    )
    result = json.loads(response.content[0].text)
    logger.info(f"[AI] match_providers result: {result}")
    return result
