import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import patch, MagicMock

# =========================================
#             Endpoint tests
# =========================================

# Test that flask is set up correctly
def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'

# Test the validate endpoint works correctly with status 200 or that
# it returns 400 for invalid URL, 404 for no URL, and 500 for 
# server errors
def test_validate_endpoint(client):
    response = client.post('/validate', json={
        "url": "https://github.com/62595-fullstack-gruppe-placeholder/testrepo"
    })
    assert response.status_code == 200
    assert response.json['valid'] == True

    response = client.post('/validate', json="")
    assert response.status_code == 400
    assert response.json['valid'] == False

    response = client.post('/validate', json={
        "url": "notAValidUrl.com"
    })
    assert response.status_code == 400
    assert response.json['valid'] == False
    # Make it throw an exception by sending data instead of json which the validate function can't parse
    response = client.post('/validate', data={
        "url": "notAValidUrl.com"
    })
    assert response.status_code == 500
    assert response.json['valid'] == False

# Test the scan endpoint works correctly with status 202 or
# that it returns 400 for invalid or missing URLs and 500 for other exceptions
def test_scan_endpoint(client):
    mock_pending_jobs = {
        '123': 'https://github.com/62595-fullstack-gruppe-placeholder/testrepo'
    }
    
    # Test 1: Valid pending jobs

    # This mocks all database calls and other necessary functions
    with patch('api.getAllPendingScanJobs') as mock_get_jobs, \
         patch('api.insertDurationInScanJobs'), \
         patch('api.setParsingScanJobsToParsed'), \
         patch('api.getAllScanFindings', return_value=[]), \
         patch('psycopg2.connect') as mock_pg_connect, \
         patch('api.validate_github_url', return_value=(True, 'OK', {'owner': 'user', 'repo': 'repo'})) as mock_validate, \
         patch('logic.GitHubSecretScanner') as mock_scanner, \
         patch('subprocess.run'), \
         patch('shutil.rmtree'):  # For temp dir cleanup
        
        # Configures the return values of the mocks
        mock_get_jobs.return_value = mock_pending_jobs
        mock_pg_connect.return_value = MagicMock()
        mock_scanner_instance = MagicMock()
        mock_scanner_instance.run.return_value = None    
        mock_scanner.return_value = mock_scanner_instance
        
        response = client.post('/scan', json={"isDeepScan": False})
        print(f"Status: {response.status_code}")
        print(f"JSON: {response.json}")
        assert response.status_code == 202
        assert response.json['success'] is True
    
    # Test 2: No pending jobs

        mock_get_jobs.return_value = {}
        
        response = client.post('/scan', json={"isDeepScan": False})
        assert response.status_code == 200
        assert response.json['success'] is False
    
    # Test 3: Validation fails
        mock_get_jobs.return_value = mock_pending_jobs
        mock_validate.return_value = (False, 'Bad URL', None)
        
        response = client.post('/scan', json={"isDeepScan": False})
        assert response.status_code == 400
        assert 'error' in response.json


# =========================================
#        Recursive scan endpoint tests
# =========================================





FAKE_SCAN_ID = "11111111-1111-1111-1111-111111111111"
# Pytest fixture that provides a realistic recurring scan record for use in tests,
# with a fixed ID, GitHub URL, HOURLY interval, and UTC timestamps.
@pytest.fixture
def fake_scan():
    from datetime import datetime, timezone
    return {
        "id": FAKE_SCAN_ID,
        "repo_url": "https://github.com/someuser/somerepo",
        "interval": "HOURLY",
        "is_deep_scan": False,
        "is_active": True,
        "last_run_at": None,
        "next_run_at": datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        "created_at": datetime(2026, 1, 1, 11, 0, 0, tzinfo=timezone.utc),
    }


# Verifies that POST /recursive-scan with valid url, interval, and isDeepScan
# returns 201 and a response body confirming success and the correct interval.
# The background thread is mocked so no actual scan runs.

def test_create_recursive_scan_success(client, fake_scan):
    with patch('api.insertRecursiveScan', return_value=(FAKE_SCAN_ID, fake_scan["next_run_at"])), \
         patch('api.threading.Thread') as mock_thread:
        mock_thread.return_value.start = lambda: None
        response = client.post('/recursive-scan', json={
            "url": "https://github.com/someuser/somerepo",
            "interval": "HOURLY",
            "isDeepScan": False,
        })
    assert response.status_code == 201
    assert response.json['success'] is True
    assert response.json['interval'] == 'HOURLY'



# Verifies that POST /recursive-scan returns 400 when required fields are missing:
#    Missing interval (only url provided)
#    Missing url (only interval provided)

def test_create_recursive_scan_missing_fields(client):
    response = client.post('/recursive-scan', json={"url": "https://github.com/someuser/somerepo"})
    assert response.status_code == 400

    response = client.post('/recursive-scan', json={"interval": "HOURLY"})
    assert response.status_code == 400



# Verifies that POST /recursive-scan returns 400 when the interval value is not
# one of the accepted options (fx "FORTNIGHTLY" is not a valid interval).
def test_create_recursive_scan_invalid_interval(client):
    response = client.post('/recursive-scan', json={
        "url": "https://github.com/someuser/somerepo",
        "interval": "FORTNIGHTLY",
    })
    assert response.status_code == 400



# Verifies that POST /recursive-scan returns 400 when the provided URL
# is not a valid GitHub repository URL.
def test_create_recursive_scan_invalid_url(client):
    response = client.post('/recursive-scan', json={
        "url": "not-a-github-url.com",
        "interval": "DAILY",
    })
    assert response.status_code == 400





# Verifies that GET /recursive-scan returns a 200 with a JSON array of scans,
# and that each entry contains the expected fields (fx interval).
def test_list_recursive_scans(client, fake_scan):
    with patch('api.getAllRecursiveScans', return_value=[dict(fake_scan)]):
        response = client.get('/recursive-scan')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert response.json[0]['interval'] == 'HOURLY'




# Verifies that DELETE /recursive-scan/<id> returns 200 with success=True
# when the scan exists and is successfully deleted.
def test_delete_recursive_scan_found(client):
    with patch('api.deleteRecursiveScan', return_value=True):
        response = client.delete(f'/recursive-scan/{FAKE_SCAN_ID}')
    assert response.status_code == 200
    assert response.json['success'] is True




# Verifies that DELETE /recursive-scan/<id> returns 404 when no scan
# with the given ID exists.
def test_delete_recursive_scan_not_found(client):
    with patch('api.deleteRecursiveScan', return_value=False):
        response = client.delete(f'/recursive-scan/{FAKE_SCAN_ID}')
    assert response.status_code == 404




# Verifies that PATCH /recursive-scan/<id>/toggle returns 200 with is_active=True
# when the scan exists and is successfully toggled.
def test_toggle_recursive_scan_active(client):
    with patch('api.toggleRecursiveScan', return_value=True):
        response = client.patch(f'/recursive-scan/{FAKE_SCAN_ID}/toggle')
    assert response.status_code == 200
    assert response.json['is_active'] is True





# Verifies that PATCH /recursive-scan/<id>/toggle returns 404 when the scan
# does not exist (toggle returns None).
def test_toggle_recursive_scan_not_found(client):
    with patch('api.toggleRecursiveScan', return_value=None):
        response = client.patch(f'/recursive-scan/{FAKE_SCAN_ID}/toggle')
    assert response.status_code == 404
