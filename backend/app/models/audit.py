import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index
from backend.app.database import Base

class AgentExecutionLog(Base):
    __tablename__ = "agent_execution_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_name = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # success, failure, fallback
    execution_time_ms = Column(Integer, default=0, nullable=False)
    detail = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class ExternalProviderEvent(Base):
    __tablename__ = "external_provider_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_name = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="processed", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    detail = Column(JSON, default=dict, nullable=False)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_audit_user_action", "user_id", "action"),
    )

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    booking_ref = Column(String(100), nullable=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, IN_REVIEW, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
