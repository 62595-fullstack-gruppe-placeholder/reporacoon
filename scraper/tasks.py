import os
import time
import math
from celery import Celery
from repository import (
    insertScanJob,
    insertDurationInScanJobs,
    setParsingScanJobsToParsed,
    updateRecursiveScanAfterRun,
)
from logic import GitHubSecretScanner

BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")

celery_app = Celery("tasks", broker=BROKER_URL, backend=BROKER_URL)

# Max 4 scans running concurrently per worker (controlled by --concurrency in docker-compose)
celery_app.conf.update(
    task_acks_late=True,           # only ack after task completes, so a crashed worker re-queues the job
    worker_prefetch_multiplier=1,  # each worker picks up one job at a time from the queue
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def run_scan_job(self, job_id, repo_url, is_deep_scan, extensions):
    """Run a single scan job. Called from /scan endpoint."""
    try:
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)
        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def run_recursive_scan_job(self, recursive_id, repo_url, is_deep_scan, extensions):
    """Run a recurring scan job. Called from scheduler and /run-now endpoint."""
    try:
        job_id = insertScanJob(repo_url, recursive_scan_id=recursive_id)
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)

        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
        updateRecursiveScanAfterRun(recursive_id)

        print(f"[celery] Recursive scan complete for {repo_url} (job {job_id})")
    except Exception as exc:
        raise self.retry(exc=exc)
