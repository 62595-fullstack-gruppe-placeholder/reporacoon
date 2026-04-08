-- create listening_repositories table
CREATE TABLE IF NOT EXISTS listening_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    repo_url TEXT NOT NULL,
    secret_hash TEXT,
    UNIQUE (repo_url, owner_id)
);

-- add scan_jobs -> listening_repositories foreign key
ALTER TABLE scan_jobs
    ADD COLUMN IF NOT EXISTS listening_repository_id UUID REFERENCES listening_repositories(id) ON DELETE CASCADE;
