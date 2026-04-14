-- create enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branchconfig') THEN
    CREATE TYPE BranchConfig AS ENUM ('DEFAULT', 'CUSTOM', 'ALL');
  END IF;
END$$;

-- create listening_repositories table
CREATE TABLE IF NOT EXISTS listening_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    repo_url TEXT UNIQUE NOT NULL,
    secret_hash TEXT,
    branches TEXT[] DEFAULT '{}' NOT NULL,
    branch_config BranchConfig NOT NULL DEFAULT 'DEFAULT'
);

-- add scan_jobs -> listening_repositories foreign key
ALTER TABLE scan_jobs
    ADD COLUMN IF NOT EXISTS listening_repository_id UUID REFERENCES listening_repositories(id) ON DELETE CASCADE;
