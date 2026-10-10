import abc
import json
import re
import datetime
from typing import Dict, Any, List, Optional
import httpx
from backend.app.config import settings

class BaseAIProvider(abc.ABC):
    @abc.abstractmethod
    async def parse_travel_intent(self, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Extract structured travel entities from user message."""
        pass

    @abc.abstractmethod
    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generate conversational response."""
        pass

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        pass


class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    @property
    def provider_name(self) -> str:
        return "GOOGLE_GEMINI"

    async def parse_travel_intent(self, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)

            prompt = f"""
You are the Natural Language Understanding (NLU) module for RailMate, an Indian railway assistant.
Analyze the user's travel request and extract the parameters in JSON format.

User message: "{user_message}"
Context/History: {json.dumps(history or [])}

Extract:
- origin: (string or null) Origin city or station (e.g., "Mumbai", "Jaipur", "Delhi", "Ahmedabad", "Pune")
- destination: (string or null) Destination city or station
- travel_date: (string in YYYY-MM-DD format or null). If the user mentions "20 December", use "2026-12-20". If relative (e.g., tomorrow), calculate based on current date.
- departure_time_preference: (string or null, e.g. "morning", "evening", "after 18:00")
- passenger_count: (integer, default 1)
- max_transfers: (integer, default 2. If user specifies "direct" or "no changes", set 0. If "no more than one change", set 1.)
- preference: ("fastest", "cheapest", or "fewest", default "fastest")
- is_complete: (boolean, true if both origin, destination, and travel_date are clearly identified)
- missing_fields: (list of strings for missing required fields: "origin", "destination", "travel_date")
- clarifying_question: (string or null. If missing_fields is not empty, formulate a polite clarifying question. Never invent missing cities or dates!)

Return ONLY valid JSON matching this schema with no markdown code blocks or extra words.
"""
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            # Clean possible markdown formatting
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
            data = json.loads(text.strip())
            return data
        except Exception as e:
            # Fallback to deterministic parser if API fails or rate-limited
            fallback = DeterministicFallbackProvider()
            result = await fallback.parse_travel_intent(user_message, history)
            result["notice"] = f"Gemini API unavailable ({str(e)}), used rule-based fallback."
            return result

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)
            response = await model.generate_content_async(f"{system_prompt}\n\nUser: {user_prompt}")
            return response.text.strip()
        except Exception as e:
            return f"I understand your railway query: '{user_prompt}'. (AI notice: {str(e)})"


class OpenRouterProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = "mistralai/mistral-7b-instruct:free"):
        self.api_key = api_key
        self.model_name = model_name

    @property
    def provider_name(self) -> str:
        return "OPENROUTER"

    async def parse_travel_intent(self, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        prompt = f"""Extract travel parameters as JSON from: "{user_message}".
Return JSON with keys: origin, destination, travel_date (YYYY-MM-DD), departure_time_preference, passenger_count (int), max_transfers (int), preference (fastest|cheapest|fewest), is_complete (bool), missing_fields (list), clarifying_question (str)."""
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "You are a travel extraction assistant. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                data = res.json()
                raw_json = data["choices"][0]["message"]["content"]
                return json.loads(raw_json)
        except Exception:
            fallback = DeterministicFallbackProvider()
            return await fallback.parse_travel_intent(user_message, history)

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                return res.json()["choices"][0]["message"]["content"]
        except Exception:
            return f"Processed travel request: {user_prompt}"


class DeterministicFallbackProvider(BaseAIProvider):
    KNOWN_CITIES = [
        "Mumbai", "Jaipur", "Delhi", "New Delhi", "Ahmedabad", "Vadodara",
        "Pune", "Kota", "Agra", "Kanpur", "Varanasi", "Kolkata", "Bengaluru",
        "Bangalore", "Chennai", "Hyderabad", "Goa", "Madgaon", "Surat"
    ]

    @property
    def provider_name(self) -> str:
        return "DETERMINISTIC_FALLBACK"

    async def parse_travel_intent(self, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        low = user_message.lower()
        origin = None
        destination = None

        # Look into previous history if user is refining or providing a missing field
        context_origin = None
        context_dest = None
        context_date = None
        if history:
            for item in reversed(history):
                meta = item.get("metadata", {})
                if not context_origin and meta.get("origin"):
                    context_origin = meta.get("origin")
                if not context_dest and meta.get("destination"):
                    context_dest = meta.get("destination")
                if not context_date and meta.get("travel_date"):
                    context_date = meta.get("travel_date")

        # 1. Check patterns like "from <CityA> to <CityB>"
        from_to_match = re.search(r"from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+on|\s+prefer|\s+with|$|\.|\,)", low)
        if from_to_match:
            cand_from = from_to_match.group(1).strip()
            cand_to = from_to_match.group(2).strip()
            for city in self.KNOWN_CITIES:
                if city.lower() == cand_from.lower():
                    origin = city
                if city.lower() == cand_to.lower():
                    destination = city

        # 2. General search across known cities
        if not origin or not destination:
            found = []
            for city in sorted(self.KNOWN_CITIES, key=lambda c: len(c), reverse=True):
                if re.search(r"\b" + re.escape(city.lower()) + r"\b", low):
                    if city not in found:
                        found.append(city)
            if not origin and len(found) >= 1:
                origin = found[0]
            if not destination and len(found) >= 2:
                destination = found[1]

        # Use context if still missing
        if not origin and context_origin:
            origin = context_origin
        if not destination and context_dest:
            destination = context_dest

        # Date extraction
        travel_date = None
        date_iso = re.search(r"(\d{4}-\d{2}-\d{2})", user_message)
        if date_iso:
            travel_date = date_iso.group(1)
        else:
            # Check patterns like "20 December" or "20th December"
            date_words = re.search(r"(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)", low)
            if date_words:
                day = int(date_words.group(1))
                month_str = date_words.group(2)
                month_map = {
                    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
                    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
                }
                m = month_map.get(month_str, 12)
                year = datetime.datetime.now().year
                travel_date = f"{year}-{m:02d}-{day:02d}"
            elif "tomorrow" in low:
                tmrw = datetime.datetime.now() + datetime.timedelta(days=1)
                travel_date = tmrw.strftime("%Y-%m-%d")
            elif "today" in low:
                travel_date = datetime.datetime.now().strftime("%Y-%m-%d")

        if not travel_date and context_date:
            travel_date = context_date

        # Preference extraction
        preference = "fastest"
        if "cheap" in low or "budget" in low or "lowest fare" in low:
            preference = "cheapest"
        elif "fewest" in low or "direct" in low or "less change" in low or "fewer change" in low or "no change" in low:
            preference = "fewest"

        # Max transfers
        max_transfers = 2
        if "direct" in low or "no transfer" in low or "no change" in low:
            max_transfers = 0
        elif "one change" in low or "1 change" in low or "1 transfer" in low or "one transfer" in low:
            max_transfers = 1

        # Passenger count
        passengers = 1
        pax_match = re.search(r"(\d+)\s*(?:passenger|passengers|pax|people|person|persons)", low)
        if pax_match:
            passengers = max(1, min(6, int(pax_match.group(1))))

        # Missing fields identification
        missing_fields = []
        if not origin:
            missing_fields.append("origin")
        if not destination:
            missing_fields.append("destination")
        if not travel_date:
            missing_fields.append("travel_date")

        is_complete = len(missing_fields) == 0
        clarifying_question = None

        if not is_complete:
            if not origin and not destination:
                clarifying_question = "Which cities will you be traveling between? (e.g. from Mumbai to Jaipur)"
            elif not origin:
                clarifying_question = f"Where will you be departing from to reach {destination}?"
            elif not destination:
                clarifying_question = f"Where would you like to travel to from {origin}?"
            elif not travel_date:
                clarifying_question = f"What date would you like to travel from {origin} to {destination}? (e.g. 2026-12-20)"

        return {
            "origin": origin,
            "destination": destination,
            "travel_date": travel_date,
            "departure_time_preference": None,
            "passenger_count": passengers,
            "max_transfers": max_transfers,
            "preference": preference,
            "is_complete": is_complete,
            "missing_fields": missing_fields,
            "clarifying_question": clarifying_question
        }

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        return f"Acknowledged. Routing through RailMate assistant."


def get_ai_provider() -> BaseAIProvider:
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        return GeminiAIProvider(settings.GEMINI_API_KEY, settings.AI_MODEL)
    elif settings.AI_PROVIDER == "openrouter" and settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip() and settings.OPENROUTER_API_KEY != "your_openrouter_api_key_here":
        return OpenRouterProvider(settings.OPENROUTER_API_KEY)
    else:
        return DeterministicFallbackProvider()
