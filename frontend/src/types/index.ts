export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  phone?: string;
  preferences: {
    default_class?: string;
    berth_preference?: string;
    email_alerts?: boolean;
    journey_reminders?: boolean;
    [key: string]: any;
  };
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface RouteLeg {
  train_number: string;
  train_name: string;
  from_station_code: string;
  from_station_name: string;
  from_city: string;
  to_station_code: string;
  to_station_name: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  fare_inr: number;
}

export interface RouteItinerary {
  id: string;
  train_number: string;
  train_name: string;
  origin: string;
  destination: string;
  from_station: string;
  to_station: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  transfers: number;
  fare_inr: number;
  travel_date: string;
  connection_at?: string | null;
  connection_wait_minutes?: number | null;
  legs: RouteLeg[];
  source: string;
  status: string;
}

export interface RouteSearchResponse {
  routes: RouteItinerary[];
  count: number;
  source: string;
  live_data: boolean;
  message: string;
}

export interface ExtractedEntities {
  origin?: string | null;
  destination?: string | null;
  travel_date?: string | null;
  departure_time_preference?: string | null;
  passenger_count?: number;
  max_transfers?: number;
  preference?: 'fastest' | 'cheapest' | 'fewest';
  is_complete: boolean;
  missing_fields: string[];
}

export interface ChatMessageResponse {
  reply: string;
  conversation_id: number;
  extracted: ExtractedEntities;
  suggested_routes?: RouteItinerary[] | null;
  agent: string;
  provider: string;
  ai_enabled: boolean;
  notice?: string | null;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'M' | 'F' | 'O';
  berth_preference?: string;
}

export interface BookingPreview {
  origin: string;
  destination: string;
  travel_date: string;
  train_number: string;
  train_name: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  transfers: number;
  passenger_count: number;
  base_fare_per_passenger: number;
  gst_inr: number;
  service_charge_inr: number;
  total_fare_inr: number;
  provider_mode: string;
  passengers: Passenger[];
  notice: string;
}

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note: string;
}

export interface Booking {
  id: number;
  booking_ref: string;
  origin: string;
  destination: string;
  travel_date: string;
  train_name: string;
  train_number: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  transfers: number;
  fare_inr: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING_CONFIRMATION';
  provider_mode: string;
  passengers: Passenger[];
  status_history: StatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  kind: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface AgentLog {
  id: number;
  agent_name: string;
  action: string;
  status: string;
  execution_time_ms: number;
  detail: any;
  created_at: string;
}

export interface ProviderHealthItem {
  name: string;
  type: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'SIMULATED';
  latency_ms: number;
  details: string;
}

export interface AdminOverview {
  metrics: {
    total_users: number;
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_searches: number;
    total_stations: number;
    total_trains: number;
    active_agent_calls: number;
  };
  recent_bookings: any[];
  recent_agent_logs: AgentLog[];
  provider_health: ProviderHealthItem[];
}
