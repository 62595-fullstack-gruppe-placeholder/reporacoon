import sys
import os
import uuid
import pytest
import psycopg2

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import repository
from repository import (
    get_connection,
    getAllPendingScanJobs,
    setParsingScanJobsToParsed,
    getAllScanFindings,
    insertScanFindings,
    insertDurationInScanJobs,
    getUserTier,
    setUserTier,
)

def test_get_connection(mock_get_connection):
    conn = get_connection()
    assert conn is not None
    with conn.cursor() as cur:
        cur.execute("SELECT 1")
        assert cur.fetchone()[0] == 1

def test_get_all_pending_scan_jobs(mock_get_connection, insert_helpers):
    _, insert_scan = insert_helpers

    id1 = insert_scan("http://a.example.com", status="PENDING")
    id2 = insert_scan("http://b.example.com", status="PENDING")
    _ = insert_scan("http://c.example.com", status="PARSED")

    result = getAllPendingScanJobs()

    assert isinstance(result, dict)
    assert id1 in result and id2 in result
    assert result[id1] == "http://a.example.com"
    assert result[id2] == "http://b.example.com"

    assert all(v != "http://c.example.com" for v in result.values())

    with repository.get_connection().cursor() as cur:
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (id1,))
        assert cur.fetchone()[0] == "PARSING"
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (id2,))
        assert cur.fetchone()[0] == "PARSING"

def test_set_parsing_scan_jobs_to_parsed(mock_get_connection, insert_helpers):
    _, insert_scan = insert_helpers

    id1 = insert_scan("url1", status="PARSING")
    id2 = insert_scan("url2", status="PARSING")
    id3 = insert_scan("url3", status="PENDING")

    setParsingScanJobsToParsed([id1])

    with repository.get_connection().cursor() as cur:
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (id1,))
        assert cur.fetchone()[0] == "PARSED"
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (id2,))
        assert cur.fetchone()[0] == "PARSING"
        cur.execute("SELECT status FROM scan_jobs WHERE id = %s", (id3,))
        assert cur.fetchone()[0] == "PENDING"

def test_get_all_scan_findings(mock_get_connection, insert_helpers):
    _, insert_scan = insert_helpers
    jid = insert_scan("foo")

    with repository.get_connection().cursor() as cur:
        cur.execute(
            "INSERT INTO scan_findings (job_id, file_path, line_number, code_snippet, severity, rule) VALUES (%s, %s, %s, %s, %s, %s)",
            (jid, "/path", 5, "xyz", "LOW", "ruleX"),
        )

    findings = getAllScanFindings()
    assert isinstance(findings, list)
    assert any(f[1] == jid for f in findings)

def test_insert_scan_findings(db_transaction, mock_get_connection, insert_helpers):
    _, insert_scan_job = insert_helpers
    jid = insert_scan_job("bar")

    repository.insertScanFindings(jid, "/file", 10, "abc", "MEDIUM", "ruleY")

    with db_transaction.cursor() as cur:  
        cur.execute(
            "SELECT job_id, file_path, line_number, code_snippet, severity, rule "
            "FROM scan_findings WHERE job_id = %s", 
            (jid,),
        )
        row = cur.fetchone()
        assert row == (jid, "/file", 10, "abc", "MEDIUM", "ruleY")

    with pytest.raises(psycopg2.Error):
        repository.insertScanFindings(jid, "/bad", "notint", "x", "LOW", "r")

def test_insert_duration_in_scanjobs(mock_get_connection, insert_helpers):
    _, insert_scan = insert_helpers
    id1 = insert_scan("d1")
    id2 = insert_scan("d2")

    insertDurationInScanJobs(123, id1)

    with repository.get_connection().cursor() as cur:
        cur.execute("SELECT duration FROM scan_jobs WHERE id = %s", (id1,))
        d1 = cur.fetchone()[0]
        cur.execute("SELECT duration FROM scan_jobs WHERE id = %s", (id2,))
        d2 = cur.fetchone()[0]
    assert d1 == 123
    assert d2 is None

def test_get_user_tier_defaults_to_free(mock_get_connection, insert_helpers):
    insert_user, _ = insert_helpers
    user_id = insert_user("tier_free@example.com")
    tier = getUserTier(user_id)
    assert tier == "free"

def test_set_user_tier_to_pro(mock_get_connection, insert_helpers):
    insert_user, _ = insert_helpers
    user_id = insert_user("tier_pro@example.com")
    result = setUserTier(user_id, "pro")
    assert result is True
    tier = getUserTier(user_id)
    assert tier == "pro"

def test_set_user_tier_back_to_free(mock_get_connection, insert_helpers):
    insert_user, _ = insert_helpers
    user_id = insert_user("tier_downgrade@example.com")
    setUserTier(user_id, "pro")
    setUserTier(user_id, "free")
    tier = getUserTier(user_id)
    assert tier == "free"

def test_get_user_tier_unknown_user(mock_get_connection):
    tier = getUserTier(str(uuid.uuid4()))
    assert tier is None

def test_set_user_tier_unknown_user(mock_get_connection):
    result = setUserTier(str(uuid.uuid4()), "pro")
    assert result is False