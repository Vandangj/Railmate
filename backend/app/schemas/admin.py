import datetime
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SystemMetrics(BaseModel):
    total_users: int
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    total_searches: int
    total_stations: int
    total_trains: int
    active_agent_calls: int

class AgentLogResponse(BaseModel):
    id: int
    agent_name: str
    action: str
    status: str
    execution_time_ms: int
    detail: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ProviderHealthItem(BaseModel):
    name: str
    type: str  # AI, RAILWAY, DATABASE
    status: str  # OPERATIONAL, DEGRADED, SIMULATED
    latency_ms: int
    details: str

class ProviderHealthResponse(BaseModel):
    providers: List[ProviderHealthItem]
    timestamp: datetime.datetime

class AdminOverviewResponse(BaseModel):
    metrics: SystemMetrics
    recent_bookings: List[Dict[str, Any]]
    recent_agent_logs: List[AgentLogResponse]
    provider_health: List[ProviderHealthItem]
