-- Tracks side effects that have already run, keyed by idempotency_key (the job's id).
-- Lets a reclaimed/retried job check if its work already happened instead of redoing it.
create table applied_effects(
    idempotency_key text primary key,
    applied_at timestamptz default now()
)