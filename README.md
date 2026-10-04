# Job Queue

A minimal background job queue built from scratch on top of Postgres — the same pattern behind tools like Sidekiq, Celery, and BullMQ, implemented from first principles to understand how they actually work.

## Why

Most apps eventually need to run work outside the request/response cycle: sending emails, processing uploads, calling slow external APIs. This project builds that infrastructure piece by piece — starting with a basic enqueue/process loop and working up to safe concurrent workers, retries, and idempotency.

## Architecture

- **Producer** — a small Express API (`POST /jobs`) that inserts jobs into Postgres.
- **Worker** — a standalone Node process that polls Postgres for pending jobs, claims one, executes it, and records the result.
- **Postgres** — the source of truth for job state (`pending → processing → done`/`failed`).

```
producer (Express) --> INSERT --> [ jobs table in Postgres ] <-- polls -- worker (Node loop)
```

## Status

- [x] **v1** — basic enqueue/process loop (single worker, no retries)
- [ ] **v2** — retries with exponential backoff + dead-letter handling
- [ ] **v3** — multiple concurrent workers with safe job claiming
- [ ] **v4** — idempotency guarantees + status dashboard
- [ ] **v5** — stretch goals (scheduled jobs, priority queues, rate limiting)

## Running it locally

Requires a local Postgres instance.

1. Create the database and apply the schema:
   ```
   createdb job_queue
   psql -d job_queue -f db/schema.sql
   ```
2. Copy `.env.example` to `.env` and fill in your Postgres credentials.
3. Install dependencies:
   ```
   npm install
   ```
4. Run the producer and worker in separate terminals:
   ```
   npm run producer
   npm run worker
   ```
5. Enqueue a job:
   ```
   curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d "{\"type\":\"echo\",\"payload\":{\"message\":\"hello\"}}"
   ```
