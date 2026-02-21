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
# TODO: Test if this works
def getAllScanJobs():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT repo_url FROM scan_jobs")
            return [row[0] for row in cur.fetchall()]
    finally:
        if conn:
            conn.close()