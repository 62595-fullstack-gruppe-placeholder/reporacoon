import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import patch, MagicMock
from api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['DATABASE_URL'] = None
    with app.test_client() as client:
        yield client

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

 
