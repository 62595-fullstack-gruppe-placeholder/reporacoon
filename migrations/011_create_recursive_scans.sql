DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_interval') THEN
    CREATE TYPE scan_interval AS ENUM ('EVERY_MINUTE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EVERY_MINUTE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'scan_interval')) THEN
    ALTER TYPE scan_interval ADD VALUE 'EVERY_MINUTE' BEFORE 'HOURLY';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS recursive_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_url TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  interval scan_interval NOT NULL DEFAULT 'WEEKLY',
  is_deep_scan BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_jobs
  ADD COLUMN IF NOT EXISTS recursive_scan_id UUID REFERENCES recursive_scans(id) ON DELETE SET NULL;
