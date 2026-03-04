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

def insertScanFindings(job_id, file_path, line_number, code_snippet, severity, rule, branch):
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