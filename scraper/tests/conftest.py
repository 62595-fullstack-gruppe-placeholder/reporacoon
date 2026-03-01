import pytest
import uuid
import sys
import os
from contextlib import contextmanager
from unittest.mock import patch, MagicMock
import psycopg2.extras

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import repository


# Register UUID adapter globally
psycopg2.extras.register_uuid()

class NonClosingConnection:
    """Wrapper that prevents real close() calls."""
    def __init__(self, real_conn):
        self.real_conn = real_conn
        self.real_conn.autocommit = False
    
    def cursor(self):
        return self.real_conn.cursor()
    
    def commit(self):
        self.real_conn.commit()
    
    def close(self):
        pass  # Don't actually close!

@contextmanager
def get_test_connection():
    """Yields non-closing connection for tests."""
    conn = repository.get_connection()
    try:
        yield NonClosingConnection(conn)
    finally:
        conn.rollback()
        conn.close()

@pytest.fixture(scope="function")
def db_transaction():
    """Schema + connection for test setup."""
    with get_test_connection() as test_conn:
        # Schema setup (idempotent)
        with test_conn.cursor() as cur:
            cur.execute("""
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                DO $$ BEGIN 
                    CREATE TYPE "Status" AS ENUM ('PENDING', 'PARSING', 'PARSED', 'FAILED'); 
                EXCEPTION WHEN duplicate_object THEN null; END $$;
                DO $$ BEGIN 
                    CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); 
                EXCEPTION WHEN duplicate_object THEN null; END $$;
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email VARCHAR(255) NOT NULL UNIQUE, password_hash TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS scan_jobs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    repo_url TEXT NOT NULL, status Status NOT NULL DEFAULT 'PENDING',
                    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), duration INTEGER
                );
                CREATE TABLE IF NOT EXISTS scan_findings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    job_id UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
                    file_path TEXT NOT NULL, line_number INTEGER NOT NULL,
                    code_snippet TEXT NOT NULL, severity Severity NOT NULL, rule TEXT NOT NULL
                );
            """)
        yield test_conn.real_conn  # Raw connection for fixture queries
        test_conn.real_conn.rollback()

@pytest.fixture
def mock_get_connection(db_transaction):
    """Mock get_connection to return our test connection."""
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
