import sys
import os
import uuid
import pytest
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import repository
from repository import (
    insertRecursiveScan,
    getAllRecursiveScans,
    getDueRecursiveScans,
    updateRecursiveScanAfterRun,
    toggleRecursiveScan,
    deleteRecursiveScan,
    insertScanJob,
)

@pytest.fixture
def insert_recursive_scan(db_transaction):
    def _insert(repo_url="https://github.com/owner/repo", repoKey=None, interval="WEEKLY",
                is_deep_scan=False, is_active=True, next_run_at=None):
        rid = str(uuid.uuid4())
        if next_run_at is None:
            next_run_at = datetime.now(timezone.utc) + timedelta(days=7)
        with db_transaction.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recursive_scans
                  (id, repo_url, repoKey, interval, is_deep_scan, is_active, next_run_at)
                VALUES (%s, %s, %s, %s::scan_interval, %s, %s, %s)
                RETURNING id
                """,
                (rid, repo_url, repoKey, interval, is_deep_scan, is_active, next_run_at),
            )
        return rid
    return _insert

# =========================================
#   Repository tests
# =========================================

def test_insert_recursive_scan_creates_row(mock_get_connection):
    scan_id, next_run_at = insertRecursiveScan(
        "https://github.com/owner/repo", None, "WEEKLY"
    )
    assert scan_id is not None
    now = datetime.now(timezone.utc)
    assert next_run_at > now

@pytest.mark.parametrize("interval", ["EVERY_MINUTE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
def test_insert_recursive_scan_all_intervals(mock_get_connection, interval):
    scan_id, next_run_at = insertRecursiveScan(
        "https://github.com/owner/repo", None, interval
    )
    assert scan_id is not None
    assert next_run_at > datetime.now(timezone.utc)

def test_get_all_recursive_scans(mock_get_connection, insert_recursive_scan):
    id1 = insert_recursive_scan(repo_url="https://github.com/a/repo")
    id2 = insert_recursive_scan(repo_url="https://github.com/b/repo")

    scans = getAllRecursiveScans()
    ids = [str(s["id"]) for s in scans]
    assert id1 in ids
    assert id2 in ids

def test_get_due_recursive_scans_returns_overdue(mock_get_connection, insert_recursive_scan):
    past = datetime.now(timezone.utc) - timedelta(seconds=1)
    due_id = insert_recursive_scan(next_run_at=past, is_active=True)
    _not_due = insert_recursive_scan()  

    due = getDueRecursiveScans()
    due_ids = [str(s["id"]) for s in due]
    assert due_id in due_ids

def test_get_due_recursive_scans_skips_paused(mock_get_connection, insert_recursive_scan):
    past = datetime.now(timezone.utc) - timedelta(seconds=1)
    paused_id = insert_recursive_scan(next_run_at=past, is_active=False)

    due = getDueRecursiveScans()
    due_ids = [str(s["id"]) for s in due]
    assert paused_id not in due_ids

def test_update_recursive_scan_after_run(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan(interval="DAILY")
    before = datetime.now(timezone.utc)

    updateRecursiveScanAfterRun(scan_id)

    after = datetime.now(timezone.utc)

    with repository.get_connection().cursor() as cur:
        cur.execute(
            "SELECT last_run_at, next_run_at FROM recursive_scans WHERE id = %s",
            (scan_id,),
        )
        last_run_at, next_run_at = cur.fetchone()

    from datetime import timedelta
    assert last_run_at >= before - timedelta(seconds=1)
    assert last_run_at <= after + timedelta(seconds=1)
    assert next_run_at > last_run_at

def test_toggle_recursive_scan(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan(is_active=True)

    result = toggleRecursiveScan(scan_id)
    assert result is False

    result = toggleRecursiveScan(scan_id)
    assert result is True

def test_delete_recursive_scan(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan()

    deleted = deleteRecursiveScan(scan_id)
    assert deleted == 1

    with repository.get_connection().cursor() as cur:
        cur.execute("SELECT id FROM recursive_scans WHERE id = %s", (scan_id,))
        assert cur.fetchone() is None

def test_delete_recursive_scan_missing(mock_get_connection):
    deleted = deleteRecursiveScan(str(uuid.uuid4()))
    assert deleted == 0

def test_insert_scan_job_links_recursive_scan(mock_get_connection, insert_recursive_scan, insert_helpers):
    scan_id = insert_recursive_scan()
    job_id = insertScanJob(
        "https://github.com/owner/repo",
        recursive_scan_id=scan_id,
    )

    with repository.get_connection().cursor() as cur:
        cur.execute(
            "SELECT recursive_scan_id FROM scan_jobs WHERE id = %s", (job_id,)
        )
        row = cur.fetchone()
    assert str(row[0]) == str(scan_id)

def test_delete_recursive_scan_nullifies_job_fk(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan()
    job_id = insertScanJob(
        "https://github.com/owner/repo",
        recursive_scan_id=scan_id,
    )

    deleteRecursiveScan(scan_id)

    with repository.get_connection().cursor() as cur:
        cur.execute(
            "SELECT recursive_scan_id FROM scan_jobs WHERE id = %s", (job_id,)
        )
        row = cur.fetchone()
    assert row is not None
    assert row[0] is None