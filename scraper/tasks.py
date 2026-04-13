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


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue='fast')
def run_scan_job_pro(self, job_id, repo_url, is_deep_scan, extensions):
    """Pro tier: runs on fast queue (concurrency=4)."""
    try:
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)
        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue='slow')
def run_scan_job_free(self, job_id, repo_url, is_deep_scan, extensions):
    """Free tier: runs on slow queue (concurrency=1)."""
    try:
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)
        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue='fast')
def run_recursive_scan_job_pro(self, recursive_id, repo_url, is_deep_scan, extensions):
    """Pro tier recurring scan: runs on fast queue."""
    try:
        job_id = insertScanJob(repo_url, recursive_scan_id=recursive_id)
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)

        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
        updateRecursiveScanAfterRun(recursive_id)

        print(f"[celery] Pro recurring scan complete for {repo_url} (job {job_id})")
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue='slow')
def run_recursive_scan_job_free(self, recursive_id, repo_url, is_deep_scan, extensions):
    """Free tier recurring scan: runs on slow queue."""
    try:
        job_id = insertScanJob(repo_url, recursive_scan_id=recursive_id)
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)

        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
        updateRecursiveScanAfterRun(recursive_id)

        print(f"[celery] Free recurring scan complete for {repo_url} (job {job_id})")
    except Exception as exc:
        raise self.retry(exc=exc)
