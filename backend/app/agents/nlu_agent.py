import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.providers.ai_provider import get_ai_provider
from backend.app.schemas.chat import ExtractedEntities
from backend.app.models.audit import AgentExecutionLog

class NLUAgent:
    """Agent responsible for intent extraction, entity parsing, and formulating clarifying questions."""
    name = "Natural Language Understanding Agent"

    def __init__(self):
        self.ai_provider = get_ai_provider()

    async def extract_parameters(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        status = "success"
        extracted_raw = await self.ai_provider.parse_travel_intent(message, history)

        # Validate through Pydantic
        try:
            entities = ExtractedEntities(
                origin=extracted_raw.get("origin"),
                destination=extracted_raw.get("destination"),
                travel_date=extracted_raw.get("travel_date"),
                departure_time_preference=extracted_raw.get("departure_time_preference"),
                passenger_count=extracted_raw.get("passenger_count", 1),
                max_transfers=extracted_raw.get("max_transfers", 2),
                preference=extracted_raw.get("preference", "fastest"),
                is_complete=extracted_raw.get("is_complete", False),
                missing_fields=extracted_raw.get("missing_fields", [])
            )
        except Exception:
            entities = ExtractedEntities(
                origin=extracted_raw.get("origin"),
                destination=extracted_raw.get("destination"),
                travel_date=extracted_raw.get("travel_date"),
                is_complete=False,
                missing_fields=["origin", "destination", "travel_date"]
            )
            status = "fallback"

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Log agent execution
        if db:
            log_entry = AgentExecutionLog(
                agent_name=self.name,
                action="extract_parameters",
                status=status,
                execution_time_ms=elapsed_ms,
                detail={
                    "message": message[:100],
                    "extracted": entities.model_dump(),
                    "provider": self.ai_provider.provider_name
                }
            )
            db.add(log_entry)
            db.commit()

        return {
            "entities": entities,
            "clarifying_question": extracted_raw.get("clarifying_question"),
            "provider": self.ai_provider.provider_name,
            "notice": extracted_raw.get("notice")
        }
