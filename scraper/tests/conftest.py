import pytest
import uuid
import sys
import os
from contextlib import contextmanager
from unittest.mock import patch, MagicMock
import psycopg2.extras

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api import app
import repository

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

# Register UUID adapter globally
psycopg2.extras.register_uuid()

class NonClosingConnection:
    def __init__(self, real_conn):
        self.real_conn = real_conn
        try:
            self.real_conn.autocommit = False
        except psycopg2.ProgrammingError:
            pass
    
    def cursor(self):
        return self.real_conn.cursor()
    
    def commit(self):
        pass
    
    def close(self):
        pass

@contextmanager
def get_test_connection():
    conn = repository.get_connection()
    try:
        yield NonClosingConnection(conn)
    finally:
        conn.rollback()
        conn.close()

@pytest.fixture(scope="function")
def db_transaction():
    with get_test_connection() as test_conn:
        with test_conn.cursor() as cur:
            cur.execute("""
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                DO $$
                BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
                    CREATE TYPE Status AS ENUM ('PENDING', 'PARSING', 'PARSED', 'FAILED');
                END IF;
                END$$;

                DO $$
                BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity') THEN
                    CREATE TYPE Severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
                END IF;
                END$$;
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    tier VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
                    is_admin BOOLEAN NOT NULL DEFAULT false
                );
                DO $$
                BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_interval') THEN
                    CREATE TYPE scan_interval AS ENUM ('EVERY_MINUTE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
                END IF;
                END$$;

                CREATE TABLE IF NOT EXISTS recursive_scans (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    repo_url TEXT NOT NULL,
                    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    repoKey TEXT,
                    interval scan_interval NOT NULL DEFAULT 'WEEKLY',
                    is_deep_scan BOOLEAN NOT NULL DEFAULT false,
                    extensions TEXT[] NOT NULL DEFAULT '{}',
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    last_run_at TIMESTAMPTZ,
                    next_run_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                
                ALTER TABLE recursive_scans ADD COLUMN IF NOT EXISTS repoKey TEXT;

                CREATE TABLE IF NOT EXISTS scan_jobs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    repo_url TEXT NOT NULL, 
                    status Status NOT NULL DEFAULT 'PENDING',
                    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    repoKey TEXT,
                    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
                    duration INTEGER,
                    recursive_scan_id UUID REFERENCES recursive_scans(id) ON DELETE SET NULL
                );
                
                ALTER TABLE scan_jobs ADD COLUMN IF NOT EXISTS repoKey TEXT;

                CREATE TABLE IF NOT EXISTS scan_findings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    job_id UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
                    file_path TEXT NOT NULL, line_number INTEGER NOT NULL,
                    code_snippet TEXT NOT NULL, severity Severity NOT NULL, rule TEXT NOT NULL,
                    branch TEXT
                );
            """)
        yield test_conn.real_conn
        test_conn.real_conn.rollback()

@pytest.fixture
def mock_get_connection(db_transaction):
    with patch.object(repository, 'get_connection') as mock:
        mock.return_value = NonClosingConnection(db_transaction)
        yield mock

@pytest.fixture
def insert_helpers(db_transaction):
    def _insert_user(email):
        with db_transaction.cursor() as cur:
            new_uuid = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (new_uuid, email, "hash")
            )
            return cur.fetchone()[0]
    
    def _insert_scan_job(repo_url="https://example.com", status="PENDING", owner_id=None):
        with db_transaction.cursor() as cur:
            new_uuid = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO scan_jobs (id, repo_url, status, owner_id, priority) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (new_uuid, repo_url, status, owner_id, 1)
            )
            return cur.fetchone()[0]
    
    return _insert_user, _insert_scan_job