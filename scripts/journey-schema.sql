-- Journey demo schema. Idempotent — safe to re-run.
--
-- Two tables, deliberately. `journey_runs` is the state machine (one row per
-- visitor journey, with the portal-shaped order embedded as JSONB so the
-- portal renders it with zero joins). `journey_events` is the append-only
-- ledger every lane writes to — it feeds the live run page, the analytics
-- "Live" source, and nothing ever updates a row in it.

CREATE TABLE IF NOT EXISTS journey_runs (
  id              text PRIMARY KEY,              -- jr_<hex>
  email           text NOT NULL,
  name            text,
  product_sku     text NOT NULL,
  woo_order_id    bigint,
  order_number    text NOT NULL,                 -- #HP-9xxxx
  status          text NOT NULL DEFAULT 'awaiting_click',
                  -- awaiting_click → active → complete | expired
  stage_index     int  NOT NULL DEFAULT 0,       -- index into the 8-stage ladder
  verify_token    text NOT NULL,
  next_advance_at timestamptz,
  order_json      jsonb NOT NULL,                -- lib/store.ts Order shape
  ip_hash         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journey_runs_email_created
  ON journey_runs (email, created_at);
CREATE INDEX IF NOT EXISTS journey_runs_created
  ON journey_runs (created_at);
CREATE INDEX IF NOT EXISTS journey_runs_woo_order
  ON journey_runs (woo_order_id);

CREATE TABLE IF NOT EXISTS journey_events (
  id         bigserial PRIMARY KEY,
  run_id     text REFERENCES journey_runs(id) ON DELETE CASCADE,
  type       text NOT NULL,     -- run.started, woo.order.created, email.sent, …
  lane       text,              -- store | router | email | sms | crm | portal | analytics
  detail     jsonb,
  utm        jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journey_events_run
  ON journey_events (run_id, id);
