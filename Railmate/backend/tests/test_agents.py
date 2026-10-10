import pytest
from backend.app.agents.nlu_agent import NLUAgent
from backend.app.providers.ai_provider import DeterministicFallbackProvider

@pytest.mark.asyncio
async def test_nlu_extraction_complete_sentence():
    provider = DeterministicFallbackProvider()
    res = await provider.parse_travel_intent("Find the cheapest route from Mumbai to Jaipur on 20 December, preferably with no more than one change.")
    assert res["origin"] == "Mumbai"
    assert res["destination"] == "Jaipur"
    assert "12-20" in res["travel_date"]
    assert res["preference"] == "cheapest"
    assert res["max_transfers"] == 1
    assert res["is_complete"] is True

@pytest.mark.asyncio
async def test_nlu_missing_fields_clarifying_question():
    provider = DeterministicFallbackProvider()
    res = await provider.parse_travel_intent("I want to book a train to Jaipur.")
    assert res["destination"] == "Jaipur"
    assert res["origin"] is None
    assert res["is_complete"] is False
    assert "origin" in res["missing_fields"]
    assert res["clarifying_question"] is not None

@pytest.mark.asyncio
async def test_nlu_context_refinement():
    provider = DeterministicFallbackProvider()
    history = [
        {"role": "user", "content": "Find trains from Mumbai to Jaipur on 2026-12-20", "metadata": {"origin": "Mumbai", "destination": "Jaipur", "travel_date": "2026-12-20"}}
    ]
    refinement = await provider.parse_travel_intent("Show cheaper options instead.", history=history)
    assert refinement["origin"] == "Mumbai"
    assert refinement["destination"] == "Jaipur"
    assert refinement["preference"] == "cheapest"
