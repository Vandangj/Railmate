# RailMate — AI-Powered Multi-Agent Railway Travel Assistant

RailMate is a full-stack railway journey planning and reservation assistant engineered with **Python FastAPI**, **React + Vite + TypeScript**, **MySQL 8**, **NetworkX** graph routing algorithms, and **Google Gemini** conversational AI.

---

## 🏛️ Architecture Overview

RailMate orchestrates five logically decoupled agents managed by a central Orchestrator:

1. **Central Orchestrator**: Classifies user intents, routes parameters to appropriate agents, enforces authorization checks, and maintains execution and audit trails.
2. **Natural Language Understanding (NLU) Agent**: Parses natural language trip queries (e.g. *"Find the cheapest route from Mumbai to Jaipur on 20 December with no more than one change"*), extracts structured entities with Pydantic validation, and formulates clarifying follow-ups for ambiguous inputs. Supports Google Gemini API, OpenRouter, and a deterministic fallback solver.
3. **Route Planning Agent**: Uses a **NetworkX** directed multigraph to compute direct and connecting itineraries. Strictly enforces layover connection windows (45 to 720 minutes), prevents cyclical routes, and ranks results by **Fastest Duration**, **Cheapest Fare**, or **Fewest Transfers**.
4. **Booking Agent**: Validates passenger details (up to 6 passengers), calculates base fare, GST (5%), and convenience fees, enforces idempotency keys, and requires explicit user confirmation before recording reservations.
5. **Reservation Management Agent**: Retrieves trip histories, processes simulated cancellation requests with calculated refund values (85% after standard clerkage), and offers alternative route options for disrupted journeys.
6. **Notification Agent**: Issues in-app alerts for booking confirmations, cancellations, and status changes with read/unread tracking.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Leaflet (OpenStreetMap), Lucide Icons |
| **Backend** | Python 3.10+ FastAPI, Uvicorn, Pydantic v2 |
| **Database** | MySQL 8 (or SQLite fallback via SQLAlchemy 2.0 ORM) |
| **Routing** | NetworkX MultiDiGraph multi-hop routing solver |
| **AI / NLU** | Google Gemini API (`gemini-1.5-flash`), OpenRouter, Deterministic Parser |
| **Auth & Security** | JWT (HS256), bcrypt password hashing, Role-Based Access (User & Admin) |
| **Testing** | Pytest, Pytest-Asyncio, FastAPI TestClient |
| **Documentation** | Interactive FastAPI Swagger UI at `/docs` |

---

## 🚀 Quick Setup & Execution (Windows PowerShell)

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- (Optional) MySQL 8 (if not installed, the application defaults out of the box to local SQLite)

### 1. Backend Setup & Run

Open a Windows PowerShell terminal in the repository root:

```powershell
# 1. Create and activate a Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Copy environment configuration
copy .env.example .env

# 4. Initialize and seed database (automatically seeds demo stations, trains, and accounts)
python backend/init_db.py

# 5. Start the FastAPI development server
uvicorn backend.app.main:app --reload --port 8000
```

> **API Documentation**: Once started, open **[http://localhost:8000/docs](http://localhost:8000/docs)** for the interactive Swagger UI.

---

### 2. Frontend Setup & Run

Open a second Windows PowerShell terminal:

```powershell
# 1. Navigate to frontend folder
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite dev server
npm run dev
```

> Open your browser at **[http://localhost:5173](http://localhost:5173)** to access the RailMate platform.

---

## 🔑 Demo Accounts

The database comes pre-seeded with two accounts for evaluation:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Demo Traveler** | `demo@railmate.com` | `demo123` | Conversational Assistant, Booking Preview, My Trips, Notifications |
| **System Admin** | `admin@railmate.com` | `admin123` | Admin Dashboard, Agent Logs, Provider Health, System Audit |

*(You can also click the quick-fill buttons on the Sign In page to auto-fill these credentials).*

---

## ⚙️ Configuration & Provider Modes

Edit `.env` to configure your preferred providers:

```ini
# AI Provider: "gemini", "openrouter", or "mock"
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Railway Data Provider: "demo" or "live"
RAILWAY_PROVIDER=demo
RAILWAY_API_BASE_URL=https://api.railway-example.gov.in/v1
RAILWAY_API_KEY=

# Database URL:
# For MySQL 8:
# DATABASE_URL=mysql+pymysql://root:password@localhost:3306/railmate
# For Local Zero-Setup SQLite:
DATABASE_URL=sqlite:///./railmate.db
```

### Switching Between Demo and Live Provider Modes
1. **DEMO Mode (Default)**:
   - Queries curated Indian Railway stations, trains, and timetable schedules from the local database.
   - All booking references start with `DEMO-RM-` and are clearly labeled as illustrative.
   - Simulated cancellation and refunds are processed locally.
2. **LIVE Mode**:
   - Set `RAILWAY_PROVIDER=live` and configure `RAILWAY_API_KEY` and `RAILWAY_API_BASE_URL`.
   - The application delegates through `LiveRailwayProvider`. If credentials or external live endpoints are unavailable, RailMate gracefully logs the degraded status and falls back to demo mode without inventing fake availability or fake PNRs.

---

## 🧪 Automated Testing

Backend test suites cover authentication, NetworkX routing, multi-agent NLU extraction, booking previews, idempotency, and access controls:

```powershell
# Run backend tests
pytest backend/tests/ -v
```

---

## 📋 Implemented Pages & Features

1. **Landing Page**: Product hero, quick timetable search, popular corridors, architecture highlights.
2. **Authentication Pages**: User registration and login with bcrypt hashing, JWT issuance, and demo quick-fill.
3. **Conversational Travel Assistant**: Natural-language message interface with Google Gemini intent extraction, suggested prompt pills, entity tag visualization, and itinerary cards.
4. **Route Comparison**: NetworkX graph multi-hop timetable planner with direct vs connecting routes, layover badge, leg breakdown, and ranking filters (Fastest, Cheapest, Fewest Transfers).
5. **Interactive Network Map**: Leaflet OpenStreetMap rendering station vertices, connecting corridors, and active itinerary highlighting.
6. **Booking Review & Passenger Roster**: Add/remove passengers (up to 6), berth preferences, 5% GST breakdown, and accessible explicit confirmation dialog.
7. **My Trips Dashboard**: Upcoming and past booking history with status badges (`CONFIRMED`, `CANCELLED`).
8. **Booking Details**: Ticket summary, status audit trail timeline, simulated cancellation workflow with refund calculation, and disruption alternative route suggestions.
9. **Notification Centre**: In-app notifications with read/unread filtering, unread badge counter, and mark-as-read actions.
10. **Profile & Preferences**: Manage full name, contact, default travel class (1A, 2A, 3A, SL, CC), berth preferences, and alert preferences.
11. **Help & Support Desk**: Common FAQs, report booking failures, and submit support tickets.
12. **Admin Oversight Dashboard**: High-level system metrics, provider health telemetry (AI, Railway, DB), multi-agent execution logs with filter, and recent booking tables.
