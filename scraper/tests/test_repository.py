import sys
import os
import uuid
import pytest

# put scraper root on path before importing repository
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import repository

from api import app

# =========================================
#           Repository tests
# =========================================

# Simple test to see if the database connection works used in all other functions below
def test_get_connection(db_transaction):
    with db_transaction.cursor() as cur:
        cur.execute("SELECT 1")
        assert cur.fetchone()[0] == 1

# Test the functionality of the getAllPendingScanJobs function
# Including:
#  - Selection works
#  - Only gets jobs with pending status
#  - Returns both id and URL in a dictionary
def test_get_all_pending_scan_jobs(db_transaction, insert_helpers, mock_get_connection):
    insert_user, insert_scan_job = insert_helpers
    owner_id = insert_user("pending@test.com")
    
    # Arrange: 2 pending, 1 non-pending
    pending_id_1 = insert_scan_job("https://repo1.com", "PENDING", owner_id)
    pending_id_2 = insert_scan_job("https://repo2.com", "PENDING", owner_id)
    insert_scan_job("https://repo3.com", "PARSED", owner_id)
    
    # Act
    result = repository.getAllPendingScanJobs()
    
    # Assert: correct dict structure, only pending jobs
    assert len(result) == 2
    assert pending_id_1 in result
    assert result[pending_id_1] == "https://repo1.com"
    assert pending_id_2 in result
    assert result[pending_id_2] == "https://repo2.com"
    
    # Verify status updated to PARSING
    with db_transaction.cursor() as cur:
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (pending_id_1,))
        assert cur.fetchone()[0] == "PARSING"




# Test the functionality of the setParsingScanJobsToParsed function
# Including:
#  - Proper update of scan jobs
#  - Only updating scan jobs of given ids
def test_set_parsing_scan_jobs_to_parsed(db_transaction, insert_helpers, mock_get_connection):
    insert_user, insert_scan_job = insert_helpers
    owner_id = insert_user("parsing@test.com")
    
    # Arrange: 2 parsing (to be updated), 2 others (unchanged)
    parsing_id_1 = insert_scan_job("https://parsing1.com", "PARSING", owner_id)
    parsing_id_2 = insert_scan_job("https://parsing2.com", "PARSING", owner_id)
    other_pending = insert_scan_job("https://pending.com", "PENDING", owner_id)
    other_parsed = insert_scan_job("https://parsed.com", "PARSED", owner_id)
    
    # Act
    repository.setParsingScanJobsToParsed([str(parsing_id_1), str(parsing_id_2)])
    
    # Assert: only target IDs updated to PARSED
    with db_transaction.cursor() as cur:
        # Updated jobs
        cur.execute("SELECT status FROM scan_jobs WHERE id = ANY(%s)", ([[parsing_id_1, parsing_id_2]],))
        statuses = [row[0] for row in cur.fetchall()]
        assert all(s == "PARSED" for s in statuses)
        
        # Unchanged jobs
        cur.execute("SELECT status FROM scan_jobs WHERE id = ANY(%s)", ([[other_pending, other_parsed]],))
        statuses = [row[0] for row in cur.fetchall()]
        assert "PENDING" in statuses
        assert "PARSED" in statuses

# Test the functionality of the getAllScanFindings (debug) function
# Including:
#  - Proper selection
def test_get_all_scan_findings(db_transaction, insert_helpers, mock_get_connection):
    """Test getAllScanFindings: proper selection."""
    insert_user, insert_scan_job = insert_helpers
    owner_id = insert_user("findings@test.com")
    job_id = insert_scan_job("https://findings.com", owner_id=owner_id)
    
    # Arrange: insert findings for this job
    repository.insertScanFindings(
        job_id=str(job_id),
        file_path="src/main.py",
        line_number=42,
        code_snippet="print('vulnerable')",
        severity="HIGH",
        rule="no_print"
    )
    
    # Act
    findings = repository.getAllScanFindings()
    
    # Assert: returns findings data
    assert len(findings) >= 1
    assert any(row[1] == job_id for row in findings)  # job_id is 2nd column

# Test the functionality of the insertScanFinding function
# Including:
#  - Proper insertion
#  - Type checking for job_id, file_path, line_number, code_snippet, severity, rule
def test_insert_scan_findings(db_transaction, insert_helpers, mock_get_connection):
    """Test insertScanFindings: proper insertion, type checking."""
    insert_user, insert_scan_job = insert_helpers
    owner_id = insert_user("insert@test.com")
    job_id = insert_scan_job("https://insert.com", owner_id=owner_id)
    
    # Act
    repository.insertScanFindings(
        job_id=str(job_id),
        file_path="src/main.py",
        line_number=42,
        code_snippet="print('hello')",
        severity="HIGH",
        rule="TEST_RULE"
    )
    
    # Assert: correct insertion with proper types
    with db_transaction.cursor() as cur:
        cur.execute("""
            SELECT job_id, file_path, line_number, code_snippet, severity, rule 
            FROM scan_findings WHERE job_id = %s
        """, (job_id,))
        row = cur.fetchone()
        assert row is not None
        assert str(row[0]) == str(job_id)      # UUID
        assert row[1] == "src/main.py"         # TEXT
        assert row[2] == 42                    # INTEGER
        assert row[3] == "print('hello')"      # TEXT
        assert row[4] == "HIGH"                # Severity enum
        assert row[5] == "TEST_RULE"           # TEXT

# Test the functionality of the insertDurationInScanJobs function
# Including:
#  - Proper update of the duration column
#  - Only updating the scan job with given id
def test_insert_duration_in_scanjobs(db_transaction, insert_helpers, mock_get_connection):
    insert_user, insert_scan_job = insert_helpers
    owner_id = insert_user("duration@test.com")
    
    # Arrange: 2 jobs, only 1 gets duration
    job_id_1 = insert_scan_job("https://duration1.com", owner_id=owner_id)
    job_id_2 = insert_scan_job("https://duration2.com", owner_id=owner_id)
    
    # Act
    repository.insertDurationInScanJobs(duration=123, id=str(job_id_1))
    
    # Assert: only target job updated
    with db_transaction.cursor() as cur:
        cur.execute("SELECT id, duration FROM scan_jobs WHERE id = ANY(%s)", ([[job_id_1, job_id_2]],))
        rows = cur.fetchall()
        durations = {row[0]: row[1] for row in rows}
        assert durations[job_id_1] == 123
        assert durations[job_id_2] is None