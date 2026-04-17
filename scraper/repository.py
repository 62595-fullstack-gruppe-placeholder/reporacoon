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

def insertRecursiveScan(repo_url, repoKey, interval, is_deep_scan=False, extensions=[], owner_id=None):
    # next_run_at is calculated in SQL so it stays consistent with the DB clock.
    # The interval is passed twice because CASE requires the expression to be
    # evaluated independently from the column value being inserted.
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recursive_scans (repo_url, owner_id, repoKey, interval, is_deep_scan, extensions, next_run_at)
                VALUES (%s, %s, %s, %s::scan_interval, %s, %s,
                    CASE %s::scan_interval
                        WHEN 'EVERY_MINUTE' THEN NOW() + INTERVAL '1 minute'
                        WHEN 'HOURLY'  THEN NOW() + INTERVAL '1 hour'
                        WHEN 'DAILY'   THEN NOW() + INTERVAL '1 day'
                        WHEN 'WEEKLY'  THEN NOW() + INTERVAL '7 days'
                        WHEN 'MONTHLY' THEN NOW() + INTERVAL '1 month'
                        WHEN 'YEARLY'  THEN NOW() + INTERVAL '1 year'
                    END)
                RETURNING id, next_run_at
                """,
                (repo_url, owner_id, repoKey, interval, is_deep_scan, extensions, interval),
            )
            row = cur.fetchone()
            conn.commit()
            return row[0], row[1]
    finally:
        if conn:
            conn.close()

def getAllRecursiveScans():
    # Returns all schedules regardless of owner — used by the scraper internally.
    # The web app enforces ownership at the server-action layer.
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, repo_url, interval, is_deep_scan, extensions, is_active, last_run_at, next_run_at, created_at "
                "FROM recursive_scans ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            keys = ["id", "repo_url", "interval", "is_deep_scan", "extensions", "is_active", "last_run_at", "next_run_at", "created_at"]
            return [dict(zip(keys, r)) for r in rows]
    finally:
        if conn:
            conn.close()

def getDueRecursiveScans():
    # Called by the scheduler loop every 60 seconds.
    # Only returns active scans — paused scans (is_active = false) are skipped.
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, repo_url, interval, is_deep_scan, extensions "
                "FROM recursive_scans WHERE is_active = true AND next_run_at <= NOW()"
            )
            rows = cur.fetchall()
            keys = ["id", "repo_url", "interval", "is_deep_scan", "extensions"]
            return [dict(zip(keys, r)) for r in rows]
    finally:
        if conn:
            conn.close()

def updateRecursiveScanAfterRun(id):
    # Called at the end of every successful scan run.
    # Advances next_run_at relative to NOW() (not the previous next_run_at) so
    # a delayed run doesn't cause the next run to fire immediately.
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE recursive_scans
                SET last_run_at = NOW(),
                    next_run_at = CASE interval
                        WHEN 'EVERY_MINUTE' THEN NOW() + INTERVAL '1 minute'
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
    # Flips is_active atomically in a single UPDATE … RETURNING so the caller
    # gets the new value without needing a separate SELECT.
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
    # Deletes the schedule row. Linked scan_jobs rows are kept — their
    # recursive_scan_id is set to NULL via ON DELETE SET NULL so history is preserved.
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


def getUserTier(user_id):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT tier FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        if conn:
            conn.close()


def setUserTier(user_id, tier):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET tier = %s WHERE id = %s RETURNING id",
                (tier, user_id),
            )
            updated = cur.rowcount
            conn.commit()
            return updated > 0
    finally:
        if conn:
            conn.close()