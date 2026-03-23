import os
import psycopg2

def get_connection():
    dsn = os.environ.get("DATABASE_URL")
    if dsn:
        return psycopg2.connect(dsn)
    return psycopg2.connect(
        database=os.environ.get("POSTGRES_DB", "reporacoondb"),
        user=os.environ.get("POSTGRES_USER", "root"),
        password=os.environ.get("POSTGRES_PASSWORD", "fisk"),
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("DB_PORT", 5432)),
    )

# Gets all scan jobs with status 'PENDING'. Updates the status of all the scan jobs returned by the function to 'PARSING'
# Returns a dictionary (map) with the key being the job id and the value being the repo url
def getAllPendingScanJobs():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, repo_url FROM scan_jobs WHERE status = %s", ("PENDING",))
            rows = cur.fetchall()
            result = {row[0]: row[1] for row in rows}
            if rows:
                ids = [str(r[0]) for r in rows]
                cur.execute("UPDATE scan_jobs SET status = %s WHERE id = ANY(%s::uuid[])", ("PARSING", ids))
            conn.commit()
            return result
    finally:
        if conn:
            conn.close()

def setParsingScanJobsToParsed(ids):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("UPDATE scan_jobs SET status = %s WHERE id = ANY(%s::uuid[])", ("PARSED", ids))
            conn.commit()
    finally:
        if conn:
            conn.close()

# Unused for now, but might be handy for managing size of DB later on
def clearAllScanJobs():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM scan_jobs WHERE status = %s", ("PENDING",))
            deleted = cur.rowcount
            conn.commit()
            return deleted
    finally:
        if conn:
            conn.close()

# Used as a debug function currently
def getAllScanFindings():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM scan_findings")
            return cur.fetchall()
    finally:
        if conn:
            conn.close()

# Used as a debug function currently
def getScanFindingById(id):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM scan_findings WHERE job_id = %s", (id,),)
            return cur.fetchall()
    finally:
        if conn:
            conn.close()       

def insertScanFindings(job_id, file_path, line_number, code_snippet, severity, rule, branch="main"):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO scan_findings (job_id, file_path, line_number, code_snippet, severity, rule, branch) VALUES (%s, %s, %s, %s, %s, %s, %s) " \
                "ON CONFLICT DO NOTHING",
                (job_id, file_path, line_number, code_snippet, severity, rule, branch),
            )
            conn.commit()
    finally:
        if conn:
            conn.close()

def insertDurationInScanJobs(duration, id):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE scan_jobs SET duration = %s WHERE id = %s",
                (duration, id),
            )
            conn.commit()
    finally:
        if conn:
            conn.close()

def insertScanJob(repo_url, owner_id=None, priority=1, recursive_scan_id=None):
    """Create a new scan job and return its id."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO scan_jobs (repo_url, owner_id, priority, recursive_scan_id) VALUES (%s, %s, %s, %s) RETURNING id",
                (repo_url, owner_id, priority, recursive_scan_id),
            )
            job_id = cur.fetchone()[0]
            conn.commit()
            return job_id
    finally:
        if conn:
            conn.close()

# ---- Recursive scan repository functions ----

def insertRecursiveScan(repo_url, interval, is_deep_scan=False, owner_id=None):
    """Create a new recurring scan schedule. Returns (id, next_run_at)."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recursive_scans (repo_url, owner_id, interval, is_deep_scan, next_run_at)
                VALUES (%s, %s, %s::scan_interval, %s,
                    CASE %s::scan_interval
                        WHEN 'HOURLY'  THEN NOW() + INTERVAL '1 hour'
                        WHEN 'DAILY'   THEN NOW() + INTERVAL '1 day'
                        WHEN 'WEEKLY'  THEN NOW() + INTERVAL '7 days'
                        WHEN 'MONTHLY' THEN NOW() + INTERVAL '1 month'
                        WHEN 'YEARLY'  THEN NOW() + INTERVAL '1 year'
                    END)
                RETURNING id, next_run_at
                """,
                (repo_url, owner_id, interval, is_deep_scan, interval),
            )
            row = cur.fetchone()
            conn.commit()
            return row[0], row[1]
    finally:
        if conn:
            conn.close()

def getAllRecursiveScans():
    """Return all recurring scan schedules."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, repo_url, interval, is_deep_scan, is_active, last_run_at, next_run_at, created_at "
                "FROM recursive_scans ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            keys = ["id", "repo_url", "interval", "is_deep_scan", "is_active", "last_run_at", "next_run_at", "created_at"]
            return [dict(zip(keys, r)) for r in rows]
    finally:
        if conn:
            conn.close()

def getDueRecursiveScans():
    """Return active recurring scans whose next_run_at is in the past."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, repo_url, interval, is_deep_scan "
                "FROM recursive_scans WHERE is_active = true AND next_run_at <= NOW()"
            )
            rows = cur.fetchall()
            keys = ["id", "repo_url", "interval", "is_deep_scan"]
            return [dict(zip(keys, r)) for r in rows]
    finally:
        if conn:
            conn.close()

def updateRecursiveScanAfterRun(id):
    """Advance next_run_at to the next interval after a successful run."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE recursive_scans
                SET last_run_at = NOW(),
                    next_run_at = CASE interval
                        WHEN 'HOURLY'  THEN NOW() + INTERVAL '1 hour'
                        WHEN 'DAILY'   THEN NOW() + INTERVAL '1 day'
                        WHEN 'WEEKLY'  THEN NOW() + INTERVAL '7 days'
                        WHEN 'MONTHLY' THEN NOW() + INTERVAL '1 month'
                        WHEN 'YEARLY'  THEN NOW() + INTERVAL '1 year'
                    END
                WHERE id = %s
                """,
                (id,),
            )
            conn.commit()
    finally:
        if conn:
            conn.close()

def toggleRecursiveScan(id):
    """Flip is_active for a recurring scan. Returns the new is_active value."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE recursive_scans SET is_active = NOT is_active WHERE id = %s RETURNING is_active",
                (id,),
            )
            row = cur.fetchone()
            conn.commit()
            return row[0] if row else None
    finally:
        if conn:
            conn.close()

def deleteRecursiveScan(id):
    """Delete a recurring scan schedule."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM recursive_scans WHERE id = %s", (id,))
            deleted = cur.rowcount
            conn.commit()
            return deleted
    finally:
        if conn:
            conn.close()