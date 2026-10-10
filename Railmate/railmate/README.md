# RailMate

A responsive railway journey-planning demo with route search, a rule-based chat fallback, email-code sign-in, demo bookings, simulated cancellation, notifications, and admin monitoring.

## Important
- Train schedules and fares are illustrative demo data, not live railway information.
- Booking actions do not create IRCTC reservations, real tickets, PNRs, or refunds.
- The backend uses Hatchable's hosted runtime (`hatchable` SDK) and PostgreSQL. This is not a standalone Express/FastAPI project.
- AI provider integration and live railway data provider are not configured.

## Project structure
- `public/` — frontend HTML, CSS, JavaScript
- `api/` — Hatchable API handlers
- `migrations/` — PostgreSQL schema
- `seed.sql` — curated demo stations, trains, schedules
- `hatchable.toml` — auth settings

## Run / deploy
Import these files into a Hatchable project, deploy the project, and test route search. The `hatchable` SDK is provided by the Hatchable runtime; these API handlers are not intended to run directly with `node` outside Hatchable without adapting the auth/database layer.
