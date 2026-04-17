import sys
import os
import math
from unittest.mock import patch, MagicMock, call

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from tasks import celery_app, run_scan_job_pro, run_scan_job_free, run_recursive_scan_job_pro, run_recursive_scan_job_free

@pytest.fixture(autouse=True)
def celery_eager():
    celery_app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield
    celery_app.conf.update(task_always_eager=False)

FAKE_JOB_ID = "job-0000-0000-0000-000000000001"
FAKE_RECURSIVE_ID = "rec-0000-0000-0000-000000000001"
REPO_URL = "https://github.com/someuser/somerepo"

# ---- run_scan_job_pro ----

def test_run_scan_job_pro_success():
    with patch('tasks.GitHubSecretScanner') as mock_scanner_cls, \
         patch('tasks.insertDurationInScanJobs') as mock_duration, \
         patch('tasks.setParsingScanJobsToParsed') as mock_parsed:

        mock_scanner_cls.return_value.run = MagicMock()
        run_scan_job_pro.delay(FAKE_JOB_ID, REPO_URL, False, [], None)

        mock_scanner_cls.assert_called_once_with(REPO_URL, FAKE_JOB_ID, False, [], None)
        mock_scanner_cls.return_value.run.assert_called_once()
        mock_duration.assert_called_once()
        mock_parsed.assert_called_once_with([str(FAKE_JOB_ID)])

def test_run_scan_job_pro_uses_fast_queue():
    assert run_scan_job_pro.queue == 'fast'

# ---- run_scan_job_free ----

def test_run_scan_job_free_success():
    with patch('tasks.GitHubSecretScanner') as mock_scanner_cls, \
         patch('tasks.insertDurationInScanJobs') as mock_duration, \
         patch('tasks.setParsingScanJobsToParsed') as mock_parsed:

        mock_scanner_cls.return_value.run = MagicMock()
        run_scan_job_free.delay(FAKE_JOB_ID, REPO_URL, False, [], None)

        mock_scanner_cls.assert_called_once_with(REPO_URL, FAKE_JOB_ID, False, [], None)
        mock_scanner_cls.return_value.run.assert_called_once()
        mock_duration.assert_called_once()
        mock_parsed.assert_called_once_with([str(FAKE_JOB_ID)])

def test_run_scan_job_free_uses_slow_queue():
    assert run_scan_job_free.queue == 'slow'

def test_pro_and_free_scan_jobs_use_different_queues():
    assert run_scan_job_pro.queue != run_scan_job_free.queue

# ---- run_recursive_scan_job_pro ----

def test_run_recursive_scan_job_pro_success():
    with patch('tasks.insertScanJob', return_value=FAKE_JOB_ID) as mock_insert, \
         patch('tasks.GitHubSecretScanner') as mock_scanner_cls, \
         patch('tasks.insertDurationInScanJobs') as mock_duration, \
         patch('tasks.setParsingScanJobsToParsed') as mock_parsed, \
         patch('tasks.updateRecursiveScanAfterRun') as mock_update:

        mock_scanner_cls.return_value.run = MagicMock()
        run_recursive_scan_job_pro.delay(FAKE_RECURSIVE_ID, REPO_URL, None, False, [])

        mock_insert.assert_called_once_with(REPO_URL, recursive_scan_id=FAKE_RECURSIVE_ID)
        mock_scanner_cls.return_value.run.assert_called_once()
        mock_duration.assert_called_once()
        mock_parsed.assert_called_once_with([str(FAKE_JOB_ID)])
        mock_update.assert_called_once_with(FAKE_RECURSIVE_ID)

def test_run_recursive_scan_job_pro_uses_fast_queue():
    assert run_recursive_scan_job_pro.queue == 'fast'

# ---- run_recursive_scan_job_free ----

def test_run_recursive_scan_job_free_success():
    with patch('tasks.insertScanJob', return_value=FAKE_JOB_ID) as mock_insert, \
         patch('tasks.GitHubSecretScanner') as mock_scanner_cls, \
         patch('tasks.insertDurationInScanJobs') as mock_duration, \
         patch('tasks.setParsingScanJobsToParsed') as mock_parsed, \
         patch('tasks.updateRecursiveScanAfterRun') as mock_update:

        mock_scanner_cls.return_value.run = MagicMock()
        run_recursive_scan_job_free.delay(FAKE_RECURSIVE_ID, REPO_URL, None, False, [])

        mock_insert.assert_called_once_with(REPO_URL, recursive_scan_id=FAKE_RECURSIVE_ID)
        mock_scanner_cls.return_value.run.assert_called_once()
        mock_duration.assert_called_once()
        mock_parsed.assert_called_once_with([str(FAKE_JOB_ID)])
        mock_update.assert_called_once_with(FAKE_RECURSIVE_ID)

def test_run_recursive_scan_job_free_uses_slow_queue():
    assert run_recursive_scan_job_free.queue == 'slow'

def test_pro_and_free_recursive_jobs_use_different_queues():
    assert run_recursive_scan_job_pro.queue != run_recursive_scan_job_free.queue

# ---- retry behaviour ----

def test_run_scan_job_pro_retries_on_exception():
    with patch('tasks.GitHubSecretScanner') as mock_scanner_cls:
        mock_scanner_cls.return_value.run.side_effect = Exception("clone failed")
        with pytest.raises(Exception, match="clone failed"):
            run_scan_job_pro.delay(FAKE_JOB_ID, REPO_URL, False, [], None)

def test_run_scan_job_free_retries_on_exception():
    with patch('tasks.GitHubSecretScanner') as mock_scanner_cls:
        mock_scanner_cls.return_value.run.side_effect = Exception("clone failed")
        with pytest.raises(Exception, match="clone failed"):
            run_scan_job_free.delay(FAKE_JOB_ID, REPO_URL, False, [], None)