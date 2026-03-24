# =========================================
# Recurring scan — repository tests
#
# Test flow:
#  1. insertRecursiveScan         - row is created; next_run_at is in the future
#  2. insertRecursiveScan         - every valid interval is accepted
#  3. getAllRecursiveScans        - returns all inserted schedules
#  4. getDueRecursiveScans        - only returns active scans whose next_run_at has passed
#  5. getDueRecursiveScans        - paused scans are NOT returned even when overdue
#  6. updateRecursiveScanAfterRun - last_run_at is set, next_run_at is advanced
#  7. toggleRecursiveScan         - flips is_active and returns the new value
#  8. deleteRecursiveScan         - row is removed; returns 1
#  9. deleteRecursiveScan         - returns 0 for a non-existent id
# 10. insertScanJob (recursive)   - scan_job is linked to its recursive_scan via FK(foreign key)
# 11. DELETE SET NULL             - deleting a schedule keeps the linked scan_job row
#
# API endpoint tests live in test_api.py.
# =========================================

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


# =========================================
#   Fixtures
# =========================================

@pytest.fixture
def insert_recursive_scan(db_transaction):
    """Insert a recursive_scans row directly and return its id."""
    def _insert(repo_url="https://github.com/owner/repo", interval="WEEKLY",
                is_deep_scan=False, is_active=True, next_run_at=None):
        rid = str(uuid.uuid4())
        if next_run_at is None:
            next_run_at = datetime.now(timezone.utc) + timedelta(days=7)
        with db_transaction.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recursive_scans
                  (id, repo_url, interval, is_deep_scan, is_active, next_run_at)
                VALUES (%s, %s, %s::scan_interval, %s, %s, %s)
                RETURNING id
                """,
                (rid, repo_url, interval, is_deep_scan, is_active, next_run_at),
            )
        return rid
    return _insert


# =========================================
#   Repository tests
# =========================================

# 1. insertRecursiveScan, row created, next_run_at in the future
def test_insert_recursive_scan_creates_row(mock_get_connection):
    scan_id, next_run_at = insertRecursiveScan(
        "https://github.com/owner/repo", "WEEKLY"
    )
    assert scan_id is not None
    now = datetime.now(timezone.utc)
    assert next_run_at > now


# 2. insertRecursiveScan, all valid intervals are accepted
@pytest.mark.parametrize("interval", ["EVERY_MINUTE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
def test_insert_recursive_scan_all_intervals(mock_get_connection, interval):
    scan_id, next_run_at = insertRecursiveScan(
        "https://github.com/owner/repo", interval
    )
    assert scan_id is not None
    assert next_run_at > datetime.now(timezone.utc)


# 3. getAllRecursiveScans, returns all inserted schedules
def test_get_all_recursive_scans(mock_get_connection, insert_recursive_scan):
    id1 = insert_recursive_scan(repo_url="https://github.com/a/repo")
    id2 = insert_recursive_scan(repo_url="https://github.com/b/repo")

    scans = getAllRecursiveScans()
    ids = [str(s["id"]) for s in scans]
    assert id1 in ids
    assert id2 in ids


# 4. getDueRecursiveScans, only active + overdue scans are returned
def test_get_due_recursive_scans_returns_overdue(mock_get_connection, insert_recursive_scan):
    past = datetime.now(timezone.utc) - timedelta(seconds=1)
    due_id = insert_recursive_scan(next_run_at=past, is_active=True)
    _not_due = insert_recursive_scan()  # next_run_at is in the future

    due = getDueRecursiveScans()
    due_ids = [str(s["id"]) for s in due]
    assert due_id in due_ids


# 5. getDueRecursiveScans, paused scans are NOT returned
def test_get_due_recursive_scans_skips_paused(mock_get_connection, insert_recursive_scan):
    past = datetime.now(timezone.utc) - timedelta(seconds=1)
    paused_id = insert_recursive_scan(next_run_at=past, is_active=False)

    due = getDueRecursiveScans()
    due_ids = [str(s["id"]) for s in due]
    assert paused_id not in due_ids


# 6. updateRecursiveScanAfterRun, sets last_run_at and advances next_run_at
def test_update_recursive_scan_after_run(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan(interval="DAILY")
    before = datetime.now(timezone.utc)

    updateRecursiveScanAfterRun(scan_id)

    with repository.get_connection().cursor() as cur:
        cur.execute(
            "SELECT last_run_at, next_run_at FROM recursive_scans WHERE id = %s",
            (scan_id,),
        )
        last_run_at, next_run_at = cur.fetchone()

    assert last_run_at >= before
    assert next_run_at > last_run_at


# 7. toggleRecursiveScan, flips is_active and returns the new value
def test_toggle_recursive_scan(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan(is_active=True)

    result = toggleRecursiveScan(scan_id)
    assert result is False

    result = toggleRecursiveScan(scan_id)
    assert result is True


# 8. deleteRecursiveScan, removes the row
def test_delete_recursive_scan(mock_get_connection, insert_recursive_scan):
    scan_id = insert_recursive_scan()

    deleted = deleteRecursiveScan(scan_id)
    assert deleted == 1

    with repository.get_connection().cursor() as cur:
        cur.execute("SELECT id FROM recursive_scans WHERE id = %s", (scan_id,))
        assert cur.fetchone() is None


# 9. deleteRecursiveScan, returns 0 for a non-existent id
def test_delete_recursive_scan_missing(mock_get_connection):
    deleted = deleteRecursiveScan(str(uuid.uuid4()))
    assert deleted == 0


# 10. insertScanJob, scan_job is linked to recursive_scan with FK(foreign key)
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


# 11. ON DELETE SET NULL, deleting the schedule keeps the linked scan_job
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

