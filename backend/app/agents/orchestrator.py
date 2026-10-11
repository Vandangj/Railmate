import time
import json
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.agents.nlu_agent import NLUAgent
from backend.app.agents.route_planning_agent import RoutePlanningAgent
from backend.app.agents.booking_agent import BookingAgent
from backend.app.agents.reservation_agent import ReservationAgent
from backend.app.agents.notification_agent import NotificationAgent
from backend.app.models.conversation import Conversation, ConversationMessage
from backend.app.models.audit import AgentExecutionLog
from backend.app.schemas.chat import ChatMessageResponse, ExtractedEntities

class Orchestrator:
    """Central multi-agent coordinator for RailMate."""
    name = "Central Orchestrator"

    def __init__(self):
        self.nlu_agent = NLUAgent()
        self.route_agent = RoutePlanningAgent()
        self.booking_agent = BookingAgent()
        self.reservation_agent = ReservationAgent()
        self.notification_agent = NotificationAgent()

    async def handle_message(
        self,
        user_message: str,
        conversation_id: Optional[int],
        user_id: Optional[int],
        db: Session
    ) -> ChatMessageResponse:
        start_time = time.time()

        # 1. Retrieve or create Conversation record
        conversation = None
        if conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            conv_title = user_message[:40] + ("..." if len(user_message) > 40 else "")
            conversation = Conversation(
                user_id=user_id,
                title=f"Trip: {conv_title}"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Extract conversation context history
        recent_messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation.id
        ).order_by(ConversationMessage.id.desc()).limit(6).all()

        history_payload = []
        for m in reversed(recent_messages):
            history_payload.append({
                "role": m.role,
                "content": m.content,
                "metadata": m.metadata_json or {}
            })

        # 3. Save User message to conversation history
        user_msg_record = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=user_message,
            metadata_json={}
        )
        db.add(user_msg_record)
        db.commit()

        # 4. Dispatch to NLU Agent
        nlu_result = await self.nlu_agent.extract_parameters(
            message=user_message,
            history=history_payload,
            db=db
        )
        entities: ExtractedEntities = nlu_result["entities"]
        clarifying_q = nlu_result.get("clarifying_question")
        provider_name = nlu_result.get("provider", "GEMINI")
        notice = nlu_result.get("notice")

        suggested_routes = None
        reply = ""

        # 5. Intent resolution and dispatch
        if not entities.is_complete:
            # Need clarification from user
            reply = clarifying_q or (
                "I'd be glad to help plan your railway journey. Please tell me your origin city, "
                "destination city, and planned travel date (for example: 'Mumbai to Jaipur on 20 December')."
            )
        else:
            # Complete parameters extracted -> dispatch to Route Planning Agent
            route_res = self.route_agent.search_routes(
                origin=entities.origin,
                destination=entities.destination,
                travel_date=entities.travel_date,
                preference=entities.preference or "fastest",
                max_transfers=entities.max_transfers or 2,
                min_transfers=entities.min_transfers or 0,
                user_id=user_id,
                db=db
            )
            suggested_routes = route_res.get("routes", [])

            if suggested_routes and len(suggested_routes) > 0:
                top_route = suggested_routes[0]
                reply = (
                    f"I found {len(suggested_routes)} journey option(s) from {entities.origin} to {entities.destination} "
                    f"for {entities.travel_date}. The top recommended option is {top_route['train_name']} "
                    f"({top_route['train_number']}), taking {top_route['duration_minutes'] // 60}h {top_route['duration_minutes'] % 60}m "
                    f"with estimated fare ₹{top_route['fare_inr']} ({top_route['transfers']} transfers). "
                    f"You can review all ranked itineraries below and proceed to booking preview."
                )
            else:
                reply = (
                    f"I searched our scheduled database between {entities.origin} and {entities.destination} for {entities.travel_date}, "
                    f"but no direct or connecting itineraries were found within transfer limits. "
                    f"Our demo dataset currently connects Mumbai, Jaipur, Delhi, Ahmedabad, Vadodara, Pune, Agra, and Kota."
                )

        # 6. Save Assistant response to conversation
        assistant_meta = {
            "origin": entities.origin,
            "destination": entities.destination,
            "travel_date": entities.travel_date,
            "preference": entities.preference,
            "routes_found": len(suggested_routes) if suggested_routes else 0,
            "agent": "Central Orchestrator"
        }
        asst_msg_record = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=reply,
            metadata_json=assistant_meta
        )
        db.add(asst_msg_record)
        conversation.updated_at = datetime.datetime.utcnow()
        db.commit()

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Log Orchestrator cycle
        orchestrator_log = AgentExecutionLog(
            agent_name=self.name,
            action="coordinate_chat_flow",
            status="success",
            execution_time_ms=elapsed_ms,
            detail={
                "conversation_id": conversation.id,
                "is_complete": entities.is_complete,
                "routes_suggested": len(suggested_routes) if suggested_routes else 0
            }
        )
        db.add(orchestrator_log)
        db.commit()

        return ChatMessageResponse(
            reply=reply,
            conversation_id=conversation.id,
            extracted=entities,
            suggested_routes=suggested_routes,
            agent=self.name,
            provider=provider_name,
            ai_enabled=(provider_name != "DETERMINISTIC_FALLBACK"),
            notice=notice
        )
