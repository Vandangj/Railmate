# RailMate — AI-Powered Multi-Agent Railway Travel & Journey Planning Platform

RailMate is a full-stack, enterprise-grade railway travel assistant and multi-modal journey planner. It combines **Python FastAPI**, **React 18 + Vite + TypeScript**, **NetworkX** graph routing algorithms, and **Google Gemini** conversational AI to deliver intelligent itinerary search, automated multi-hop connection planning, dynamic fare calculations, and lifecycle booking management.

---

## 📑 Table of Contents

- [Overview & What RailMate Does](#-overview--what-railmate-does)
- [System Architecture](#-system-architecture)
  - [High-Level Architectural Flow](#high-level-architectural-flow)
  - [Multi-Agent Orchestration Subsystem](#multi-agent-orchestration-subsystem)
  - [NetworkX Graph Routing Engine](#networkx-graph-routing-engine)
  - [Dual Provider Strategy (AI & Railway Data)](#dual-provider-strategy-ai--railway-data)
  - [Data Model & Persistence](#data-model--persistence)
- [Technology Stack](#-technology-stack)
- [Repository Directory Tree](#-repository-directory-tree)
- [Feature Walkthrough](#-feature-walkthrough)
- [Setup & How to Run](#-setup--how-to-run)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup & Run](#1-backend-setup--run)
  - [2. Frontend Setup & Run](#2-frontend-setup--run)
- [Demo Credentials](#-demo-credentials)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [Automated Testing](#-automated-testing)
- [API Documentation](#-api-documentation)

---

## 🌟 Overview & What RailMate Does

Traditional train ticket booking portals require travelers to know exact station codes, manually search multiple point-to-point legs, calculate layover feasibility, and deal with rigid interfaces. RailMate solves this by offering an **AI-driven, multi-agent assistant** that understands travel intent in natural language and handles the complexity of Indian Railway journey planning.

### Key Capabilities:
1. **Natural Language Journey Assistant**: Understands queries such as *"Find me the fastest train from Mumbai to Delhi next Friday in 2A"* or *"Find the cheapest route from Bengaluru to Jaipur with at most one transfer"*, extracts structured parameters, and prompts for missing information.
2. **Multi-Hop Graph Routing**: Automatically finds both direct routes and viable connecting itineraries across a rail network graph using **NetworkX**, strictly enforcing minimum and maximum layover windows (45 to 720 minutes).
3. **Smart Ranking**: Ranks itineraries by **Fastest Duration**, **Cheapest Fare**, or **Fewest Transfers**.
4. **Interactive Geospatial Network Map**: OpenStreetMap Leaflet visualization plotting railway stations, corridors, and highlighted journey paths.
5. **Booking Preview & Transparent Pricing**: Calculates base fare across travel classes (1A, 2A, 3A, SL, CC), 5% GST, and convenience fees with passenger roster management (up to 6 passengers) and idempotency protection.
6. **Trip Lifecycle Management**: Manages tickets, displays status audit trails (`CONFIRMED`, `CANCELLED`), handles simulated cancellations with realistic refund calculation (85% refund after standard clerkage), and offers alternative routes for disrupted trips.
7. **In-App Notification Centre**: Dispatches instant notifications on booking confirmations, cancellations, and status alerts with unread badge tracking.
8. **Administrative Observability**: Provides system health telemetry, provider monitoring (Gemini, OpenRouter, Live IRCTC API, Database), execution audit logs, and analytics.

---

## 🏛️ System Architecture

### High-Level Architectural Flow

```mermaid
flowchart TD
    User([Traveler / Admin]) <--> Frontend[React 18 + Vite + TypeScript Client]
    
    Frontend <-->|REST API + JWT Bearer| API[FastAPI Application Layer]

    subgraph Backend [FastAPI Core Services]
        API --> AuthMiddleware[Auth & RBAC Middleware]
        API --> Routers[Routers: Chat, Routes, Bookings, Stations, Admin, Support]
        
        Routers --> Orchestrator[Central Orchestrator Agent]
        
        subgraph MultiAgentSystem [Coordinated Multi-Agent Architecture]
            Orchestrator --> NLUAgent[1. NLU Agent\nIntent & Entity Extraction]
            Orchestrator --> RouteAgent[2. Route Planning Agent\nMulti-Hop Solver]
            Orchestrator --> BookingAgent[3. Booking Agent\nValidation, Pricing & Idempotency]
            Orchestrator --> ResAgent[4. Reservation Agent\nLifecycle, Cancellations & Alternatives]
            Orchestrator --> NotifAgent[5. Notification Agent\nIn-App Alerts & Badges]
        end
        
        RouteAgent --> GraphEngine[NetworkX MultiDiGraph Engine]
        NLUAgent --> AIProvider[AI Provider Interface]
        RouteAgent --> RailProvider[Railway Data Provider Interface]
    end

    subgraph ExternalProviders [External Services & Fallbacks]
        AIProvider --> Gemini[Google Gemini API]
        AIProvider --> OpenRouter[OpenRouter API]
        AIProvider --> DeterministicFallback[Deterministic Regex NLP Fallback]
        RailProvider --> RapidAPI[Live IRCTC RapidAPI]
        RailProvider --> LocalCurated[Curated Database Timetables]
    end

    subgraph Storage [Database Layer]
        MultiAgentSystem --> ORM[SQLAlchemy 2.0 ORM]
        ORM --> SQLite[(SQLite Local - Default)]
        ORM -.-> MySQL[(MySQL 8 Production)]
    end
```

---

### Multi-Agent Orchestration Subsystem

RailMate uses a decoupled, role-specialized agent architecture orchestrated by a central coordinator:

| Agent | Module | Primary Responsibilities |
|---|---|---|
| **Central Orchestrator** | `backend/app/agents/orchestrator.py` | Receives incoming chat queries, coordinates execution flow across sub-agents, records structured execution audit logs (`AgentExecutionLog`), and ensures secure state transitions. |
| **NLU Agent** | `backend/app/agents/nlu_agent.py` | Extracts trip entities (`origin`, `destination`, `date`, `travel_class`, `max_transfers`, `ranking_preference`) from natural language queries using LLM prompts validated through Pydantic. Formulates clarifying questions when parameters are missing. |
| **Route Planning Agent** | `backend/app/agents/route_planning_agent.py` | Interfaces with the graph routing engine to query direct and multi-hop paths, applies timetable filters, formats transit legs and transfer stations, and ranks results. |
| **Booking Agent** | `backend/app/agents/booking_agent.py` | Validates passenger rosters (1 to 6 passengers, berth preferences, age/gender), computes exact base fares + 5% GST + convenience fee, checks idempotency keys to prevent double-booking, and commits confirmed bookings. |
| **Reservation Agent** | `backend/app/agents/reservation_agent.py` | Manages existing bookings, calculates cancellation fees and refunds (85% standard refund), appends status timeline audits, and suggests alternative itineraries if a train is canceled. |
| **Notification Agent** | `backend/app/agents/notification_agent.py` | Emits transactional notifications (`BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `STATUS_UPDATE`) with read/unread tracking and real-time badge updates. |

---

### NetworkX Graph Routing Engine

Located in `backend/app/routing/graph_router.py`, the routing system constructs a memory-efficient `networkx.MultiDiGraph`:
- **Nodes**: Railway stations (with code, city, state, latitude, longitude).
- **Edges**: Scheduled train departures between consecutive stations carrying metadata (`train_number`, `train_name`, `departure_time`, `arrival_time`, `duration_minutes`, `distance_km`, `classes`, `fares`).
- **Path Search**: Computes both direct connections and 1-transfer connecting itineraries.
- **Connection Feasibility Checks**:
  - Enforces minimum layover of **45 minutes** to permit platform transfer.
  - Enforces maximum layover of **720 minutes (12 hours)** to avoid overnight station stranding.
  - Suppresses cyclical paths (stations cannot be revisited in a single itinerary).
- **Sorting Modes**:
  - `fastest`: Ordered by total journey duration including layover.
  - `cheapest`: Ordered by cumulative base fare for the selected travel class.
  - `transfers`: Ordered by fewest connections (direct trains first).

---

### Dual Provider Strategy (AI & Railway Data)

The system includes abstraction layers with transparent fallbacks so that the platform runs reliably under all conditions:

1. **AI Provider Layer (`backend/app/providers/ai_provider.py`)**:
   - **Google Gemini**: Uses the official `google-generativeai` SDK with structured system prompts.
   - **OpenRouter**: OpenAI-compatible endpoint supporting external LLMs.
   - **Deterministic Fallback**: A local regex and station-dictionary entity parser that guarantees the platform functions seamlessly even without an external API key or during network downtime.

2. **Railway Data Provider Layer (`backend/app/providers/railway_provider.py`)**:
   - **Demo Mode (Default)**: Uses high-fidelity curated timetables for prominent Indian Railway corridors (Rajdhani, Shatabdi, Vande Bharat, Duronto, Express routes) seeded in the local database.
   - **Live Mode**: Integrates with the IRCTC Indian Railway RapidAPI (`/getPNRStatus/{pnr}`, `/between/{from}/{to}`, `/station/{code}`) for live PNR verification and real-time train schedules, falling back gracefully to local timetables if API rate limits are encountered.

---

### Data Model & Persistence

The backend uses **SQLAlchemy 2.0 ORM** with full compatibility for **SQLite** (out-of-the-box local setup) and **MySQL 8 / MariaDB** (production):

- `users`: Accounts with hashed passwords (`bcrypt`), role (`user` vs `admin`), and profile travel preferences.
- `stations`: Indian Railway stations with IRCTC code, station name, city, state, and GPS coordinates.
- `trains`: Train metadata including number, name, train type, and operational days mask.
- `train_schedules`: Station-to-station schedule legs with arrival/departure times, distance, and class-wise fare tables.
- `bookings`: Booking records with unique reference code, PNR, travel date, passenger count, class, total fare, GST, status, and audit timestamps.
- `passengers`: Passenger rosters linked to bookings with berth preference, age, and gender.
- `conversations` & `conversation_messages`: Persistent chat history with extracted entity tags and agent response metadata.
- `notifications`: User notifications with severity levels, category, and read tracking.
- `agent_execution_logs`: Traceability log capturing agent name, input payload, output, execution time (ms), and status for admin auditing.
- `support_tickets`: Helpdesk ticket submissions with issue category and status.

---

## 💻 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | **React 18** + **TypeScript** | Strict-typed component-driven single page application |
| **Build Tooling** | **Vite 5** | Ultra-fast HMR and optimized production bundling |
| **Styling & Icons** | **Tailwind CSS** + **Lucide Icons** | Modern responsive UI design, sleek cards, and accessible components |
| **Mapping & GIS** | **Leaflet** + **React-Leaflet** | OpenStreetMap interactive railway vertex and corridor rendering |
| **Backend Framework** | **FastAPI** (Python 3.10+) | High-performance asynchronous REST API framework |
| **Server** | **Uvicorn** | Lightning-fast ASGI server implementation |
| **Data Validation** | **Pydantic v2** | Request/response schema serialization and entity validation |
| **Database ORM** | **SQLAlchemy 2.0** | Object-relational mapping with SQLite and MySQL 8 engines |
| **Graph Routing** | **NetworkX 3** | Directed multigraph path discovery and timetable constraint solver |
| **AI / NLU** | **Google Gemini** (`gemini-1.5-flash` / `gemini-3.5-flash`) | Natural language intent classification and entity parsing |
| **Auth & Security** | **PyJWT** + **Passlib (bcrypt)** | Stateless JWT authentication, role-based authorization guards |
| **HTTP Client** | **HTTPX** | Async client for external AI and live railway API integration |
| **Automated Testing** | **Pytest** + **Pytest-Asyncio** | Automated testing for routing, booking, auth, and agents |

---

## 📂 Repository Directory Tree

```
Railmate/
├── .env                              # Active environment configuration (API keys, DB, provider modes)
├── .env.example                      # Template environment configuration
├── .gitignore                        # Git exclusion rules
├── package.json                      # Root workspace scripts (npm run dev, build, frontend, backend)
├── railmate.db                       # Pre-seeded SQLite database for zero-config local operation
├── requirements.txt                  # Python dependencies specification
├── README.md                         # Project documentation and architecture guide
│
├── backend/                          # FastAPI Backend Application Root
│   ├── init_db.py                    # Standalone script to initialize tables and seed demo data
│   ├── requirements.txt              # Backend-specific dependency pin file
│   ├── seed_data.py                  # Seed dataset: stations, trains, schedules, and accounts
│   │
│   ├── app/                          # Core backend package
│   │   ├── config.py                 # Application settings using Pydantic BaseSettings
│   │   ├── database.py               # SQLAlchemy database engine and session factory
│   │   ├── main.py                   # FastAPI initialization, CORS, middleware, router mount
│   │   │
│   │   ├── agents/                   # Multi-Agent subsystem
│   │   │   ├── orchestrator.py       # Central Orchestrator: query routing & execution logging
│   │   │   ├── nlu_agent.py          # NLU Agent: entity extraction & query classification
│   │   │   ├── route_planning_agent.py # Route Planning Agent: timetable queries & formatting
│   │   │   ├── booking_agent.py      # Booking Agent: pricing calculation & confirmation
│   │   │   ├── reservation_agent.py  # Reservation Agent: trip management & cancellations
│   │   │   └── notification_agent.py # Notification Agent: dispatching user notifications
│   │   │
│   │   ├── models/                   # SQLAlchemy ORM declarative models
│   │   │   ├── user.py               # User account model
│   │   │   ├── station.py            # Railway station model
│   │   │   ├── train.py              # Train and TrainSchedule models
│   │   │   ├── booking.py            # Booking and Passenger roster models
│   │   │   ├── conversation.py       # Conversation and message models
│   │   │   ├── notification.py       # User notification model
│   │   │   └── audit.py              # AgentExecutionLog and SupportTicket models
│   │   │
│   │   ├── providers/                # External provider integrations and fallbacks
│   │   │   ├── ai_provider.py        # Gemini, OpenRouter & deterministic fallback adapter
│   │   │   └── railway_provider.py   # Live RapidAPI IRCTC client & local database adapter
│   │   │
│   │   ├── routers/                  # FastAPI REST API route handlers
│   │   │   ├── auth.py               # /api/auth: Login, register, profile
│   │   │   ├── chat.py               # /api/chat: Conversational assistant endpoint
│   │   │   ├── routes.py             # /api/routes: Direct and multi-hop route queries
│   │   │   ├── bookings.py           # /api/bookings: Preview, confirm, cancel, live PNR
│   │   │   ├── stations.py           # /api/stations: Station search and GIS data
│   │   │   ├── notifications.py      # /api/notifications: In-app notification management
│   │   │   ├── admin.py              # /api/admin: Telemetry, logs, provider health
│   │   │   └── support.py            # /api/support: FAQ and customer support tickets
│   │   │
│   │   ├── routing/                  # Graph algorithmic engine
│   │   │   └── graph_router.py       # NetworkX MultiDiGraph route computation & validation
│   │   │
│   │   ├── schemas/                  # Pydantic v2 validation and serialization schemas
│   │   │   ├── auth.py               # User and token schemas
│   │   │   ├── route.py              # Route search and station schemas
│   │   │   ├── chat.py               # Chat query, entities, and conversation schemas
│   │   │   ├── booking.py            # Booking preview, confirm, and passenger schemas
│   │   │   ├── notification.py       # Notification request/response schemas
│   │   │   └── admin.py              # System stats and agent log schemas
│   │   │
│   │   └── utils/                    # Security, auth, and helper utilities
│   │       └── security.py           # Password hashing (bcrypt) and JWT encoding/decoding
│   │
│   └── tests/                        # Automated backend test suites (Pytest)
│       ├── conftest.py               # Test database fixtures and FastAPI TestClient
│       ├── test_agents.py            # Tests for NLU and multi-agent coordination
│       ├── test_auth.py              # Tests for authentication, registration, and RBAC
│       ├── test_bookings.py          # Tests for booking preview, confirmation, and idempotency
│       └── test_routing.py           # Tests for NetworkX direct and multi-hop routing logic
│
├── frontend/                         # React 18 + Vite + TypeScript Client Root
│   ├── index.html                    # Application entry HTML
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   ├── vite.config.ts                # Vite build and proxy configuration
│   ├── tailwind.config.js            # Tailwind CSS theme and utility configuration
│   │
│   └── src/                          # Frontend source code
│       ├── App.tsx                   # Main router configuration and layout wrapper
│       ├── main.tsx                  # React DOM root bootstrapping
│       ├── index.css                 # Global CSS styles and Tailwind directives
│       │
│       ├── api/                      # API client integration
│       │   └── client.ts             # Axios/fetch wrapper with JWT token injection
│       │
│       ├── context/                  # React state management
│       │   └── AuthContext.tsx       # Authentication state, login, and user profile provider
│       │
│       ├── types/                    # Shared TypeScript interfaces
│       │   └── index.ts              # Route, Booking, Station, User, and Chat types
│       │
│       ├── components/               # Reusable UI components
│       │   ├── Navbar.tsx            # Navigation bar with user profile and notification badge
│       │   ├── Footer.tsx            # Application footer with corridor links
│       │   ├── LeafletMap.tsx        # Interactive Leaflet OpenStreetMap component
│       │   ├── Modal.tsx             # Accessible dialog modal
│       │   ├── NotificationDropdown.tsx # Dropdown panel for live notification previews
│       │   └── ProtectedRoute.tsx    # Route guard enforcing authentication and roles
│       │
│       └── pages/                    # Application pages / views
│           ├── LandingPage.tsx       # Hero, quick search, popular routes, architecture showcase
│           ├── TravelAssistantPage.tsx # Chat interface with AI entity chips and itinerary cards
│           ├── RouteComparisonPage.tsx # Route results comparison with filters and leg breakdown
│           ├── RouteMapPage.tsx      # Full-page interactive rail network map
│           ├── BookingReviewPage.tsx # Passenger roster, class selector, fare calculation, GST
│           ├── BookingDetailsPage.tsx # Ticket view, audit timeline, cancellation & alternatives
│           ├── MyTripsPage.tsx       # User booking history (upcoming & past journeys)
│           ├── NotificationCentrePage.tsx # Full notification centre with filter controls
│           ├── ProfilePage.tsx       # User profile details and travel preferences
│           ├── SupportPage.tsx       # Helpdesk, FAQs, and ticket submission form
│           ├── AdminDashboardPage.tsx # Telemetry, provider health, and agent audit logs
│           ├── LoginPage.tsx         # Sign in page with demo account quick-fill
│           └── RegisterPage.tsx      # Sign up page with password validation
│
└── migrations/                       # Standalone SQL schema and seed files for MySQL 8
    ├── 001_create_tables_mysql.sql   # Production DDL schema for MySQL
    └── 002_seed_demo_data_mysql.sql  # Production seed script for MySQL
```

---

## 🧭 Feature Walkthrough

### 1. Conversational Travel Assistant (`/assistant`)
- Type queries in plain language (e.g. *"Show me trains from New Delhi to Mumbai Central tomorrow morning"*).
- The **NLU Agent** extracts key parameters (origin, destination, date, class, preference) and highlights them in dynamic entity chips.
- Interactive prompt chips allow one-click queries for popular routes.
- Returns comprehensive route cards with leg duration, departure/arrival times, and direct *"Book This Itinerary"* buttons.

### 2. Route Comparison Planner (`/routes`)
- Input origin station, destination station, date, and preferred travel class.
- Toggle between **Fastest Duration**, **Cheapest Fare**, and **Fewest Transfers**.
- Displays direct options and 1-stop connecting journeys with clear transfer station indicators and layover duration badges.

### 3. Interactive Rail Network Map (`/map`)
- Renders an OpenStreetMap canvas via Leaflet.
- Stations appear as interactive circular markers showing city, state, and station codes.
- Corridors and active route paths are highlighted with dynamic polyline overlays.

### 4. Booking Review & Passenger Roster (`/booking/review`)
- Review train schedule and leg details.
- Add and remove up to 6 passengers with full names, ages, gender, and berth preferences (Lower, Middle, Upper, Side Lower, Side Upper, Window).
- Transparent cost breakdown:
  - Base Fare $\times$ Number of Passengers
  - Goods & Services Tax (GST) at 5%
  - Standard Convenience Fee (₹15)
- Idempotent booking confirmation prevents duplicate submissions.

### 5. My Trips & Booking Details (`/trips` & `/booking/:id`)
- View all previous and upcoming journeys with status badges (`CONFIRMED`, `CANCELLED`).
- View ticket summary, passenger roster, and status timeline.
- **Simulated Cancellation**: Cancels the reservation, updates status to `CANCELLED`, computes an 85% refund after standard clerkage, and suggests immediate alternative trains if needed.

### 6. Admin Observability Dashboard (`/admin`)
- Accessible to admin accounts (`admin@railmate.com`).
- Live provider health monitors for **Google Gemini**, **Railway Data API**, and the **Database Engine**.
- Real-time **Agent Execution Logs** table detailing every sub-agent invocation, latency in milliseconds, status, and raw payload data.
- System metrics: total registered users, bookings, completed trips, and gross revenue.

---

## ⚡ Setup & How to Run

### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js 18+** and **npm**
- (Optional) **MySQL 8** (the repository runs out-of-the-box using the bundled SQLite database `railmate.db`)

---

### 1. Backend Setup & Run

Open a terminal in the project root:

```bash
# 1. Activate the Python virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows PowerShell:
# .\.venv\Scripts\Activate.ps1

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Ensure environment file exists (configured by default)
# cp .env.example .env (if .env doesn't exist)

# 4. Initialize and seed database tables
python backend/init_db.py

# 5. Start the FastAPI development server
uvicorn backend.app.main:app --reload --port 8000
```

> **API Documentation**: The interactive Swagger UI is available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### 2. Frontend Setup & Run

Open a second terminal in the project root:

```bash
# 1. Navigate into the frontend folder
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

> **Access the Web App**: Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

### Quick Workspace Script (Root `package.json`)

You can also run both or either service using root npm scripts:

```bash
# Start frontend from the root directory
npm run frontend

# Start backend using uvicorn
npm run backend
```

---

## 🔑 Demo Credentials

RailMate comes pre-populated with two test accounts:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Demo Traveler** | `demo@railmate.com` | `demo123` | Conversational Assistant, Route Planner, Booking Preview, My Trips, Notifications |
| **System Admin** | `admin@railmate.com` | `admin123` | Admin Dashboard, Agent Logs, Provider Health Telemetry, System Audit |

*(The Sign In page includes **Quick Fill** buttons to instantly populate either credential).*

---

## ⚙️ Environment Configuration (`.env`)

The `.env` file in the workspace root governs application behavior:

```ini
# App Configuration
ENVIRONMENT=development
APP_NAME=RailMate
SECRET_KEY=railmate_super_secret_jwt_key_change_in_production_987654321
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration
# Default: Zero-setup local SQLite file:
DATABASE_URL=sqlite:///./railmate.db
# For production MySQL 8:
# DATABASE_URL=mysql+pymysql://root:password@localhost:3306/railmate

# AI Provider Configuration ("gemini", "openrouter", or "mock")
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Railway Data Provider ("demo" or "live")
RAILWAY_PROVIDER=live
RAILWAY_API_BASE_URL=https://irctc-indian-railway-pnr-status.p.rapidapi.com
RAILWAY_API_KEY=your_rapidapi_key_here
RAILWAY_API_HOST=irctc-indian-railway-pnr-status.p.rapidapi.com

# CORS Configuration
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 🧪 Automated Testing

RailMate includes test suites covering authentication, routing graph algorithms, multi-agent NLU parameter extraction, booking previews, idempotency keys, and role access controls.

To run the automated tests:

```bash
# Ensure virtual environment is activated
pytest backend/tests/ -v
```

### Test Suite Coverage:
- `test_auth.py`: User registration, password hashing verification, JWT token issuance, and admin role restrictions.
- `test_routing.py`: Direct route lookups, multi-hop connection calculations, transfer layover validation (45–720m), cycle prevention, and sorting metrics.
- `test_agents.py`: NLU entity extraction, structured JSON parsing, and conversation history updates.
- `test_bookings.py`: Price calculation (base fare + GST + fee), passenger roster validation, idempotency key rejection of duplicates, and cancellation refund logic.

---

## 📚 API Documentation

Once the backend is running, FastAPI automatically serves interactive OpenAPI documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Core Endpoints Overview:
- `POST /api/auth/login` — Authenticate and receive JWT access token.
- `POST /api/auth/register` — Create new traveler account.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/chat/message` — Submit query to Central Orchestrator & Multi-Agent system.
- `GET /api/routes/search` — Search direct and connecting train itineraries.
- `GET /api/stations` — List and filter railway stations with GPS coordinates.
- `POST /api/bookings/preview` — Generate fare preview, GST breakdown, and quote.
- `POST /api/bookings/confirm` — Commit confirmed booking with passenger roster.
- `GET /api/bookings/my-bookings` — Retrieve authenticated user's booking history.
- `POST /api/bookings/{id}/cancel` — Execute simulated cancellation and calculate refund.
- `GET /api/bookings/pnr/{pnr}` — Check live or simulated PNR status.
- `GET /api/notifications` — Retrieve user notifications.
- `GET /api/admin/stats` — System metrics and provider health status.
- `GET /api/admin/logs` — Real-time multi-agent execution audit trail.

---

## 📄 License & Attribution

This project is created for demonstration and educational purposes. Timetable and booking transactions are simulated for demonstration. All Indian Railway station codes and names referenced are property of Indian Railways / IRCTC.
