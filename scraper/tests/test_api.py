import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import patch, MagicMock

# =========================================
#             Endpoint tests
# =========================================

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'

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
    
    response = client.post('/validate', data={
        "url": "notAValidUrl.com"
    })
    assert response.status_code == 500
    assert response.json['valid'] == False


# =========================================
#         Standard Scan tests
# =========================================

FAKE_JOB_ID = "job-0000-0000-0000-000000000001"
REPO_URL = "https://github.com/someuser/somerepo"

def test_scan_endpoint(client):
    with patch('api.getUserTier', return_value='free'), \
         patch('api.run_scan_job_free') as mock_free:
        
        mock_free.delay = MagicMock()

        response = client.post('/scan', json={
            "id": FAKE_JOB_ID,
            "url": REPO_URL,
            "isDeepScan": False, 
            "extensions": []
        })
        assert response.status_code == 202
        assert response.json['success'] is True
        mock_free.delay.assert_called_once_with(FAKE_JOB_ID, REPO_URL, False, [], None)

    response = client.post('/scan', json={"url": REPO_URL})
    assert response.status_code == 400

def test_scan_routes_free_user_to_slow_queue(client):
    with patch('api.getUserTier', return_value='free'), \
         patch('api.run_scan_job_free') as mock_free, \
         patch('api.run_scan_job_pro') as mock_pro:
        mock_free.delay = MagicMock()
        mock_pro.delay = MagicMock()
        
        response = client.post('/scan', json={"id": FAKE_JOB_ID, "url": REPO_URL, "userId": "fake-user", "isDeepScan": False, "extensions": []})
        
        assert response.status_code == 202
        mock_free.delay.assert_called_once()
        mock_pro.delay.assert_not_called()

def test_scan_routes_pro_user_to_fast_queue(client):
    with patch('api.getUserTier', return_value='pro'), \
         patch('api.run_scan_job_free') as mock_free, \
         patch('api.run_scan_job_pro') as mock_pro:
        mock_free.delay = MagicMock()
        mock_pro.delay = MagicMock()
        
        response = client.post('/scan', json={"id": FAKE_JOB_ID, "url": REPO_URL, "userId": "fake-user", "isDeepScan": False, "extensions": []})
        
        assert response.status_code == 202
        mock_pro.delay.assert_called_once()
        mock_free.delay.assert_not_called()

def test_scan_defaults_to_free_queue_when_no_user(client):
    with patch('api.run_scan_job_free') as mock_free, \
         patch('api.run_scan_job_pro') as mock_pro:
        mock_free.delay = MagicMock()
        mock_pro.delay = MagicMock()
        
        response = client.post('/scan', json={"id": FAKE_JOB_ID, "url": REPO_URL, "isDeepScan": False, "extensions": []})
        
        assert response.status_code == 202
        mock_free.delay.assert_called_once()
        mock_pro.delay.assert_not_called()


# =========================================
#         Admin tier endpoint tests
# =========================================

FAKE_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

def test_upgrade_user_success(client):
    with patch('api.setUserTier', return_value=True) as mock_set:
        response = client.post('/admin/upgrade', json={"userId": FAKE_USER_ID})
    assert response.status_code == 200
    assert response.json['success'] is True
    assert response.json['tier'] == 'pro'
    mock_set.assert_called_once_with(FAKE_USER_ID, 'pro')

def test_upgrade_user_not_found(client):
    with patch('api.setUserTier', return_value=False):
        response = client.post('/admin/upgrade', json={"userId": FAKE_USER_ID})
    assert response.status_code == 404

def test_upgrade_user_missing_id(client):
    response = client.post('/admin/upgrade', json={})
    assert response.status_code == 400

def test_downgrade_user_success(client):
    with patch('api.setUserTier', return_value=True) as mock_set:
        response = client.post('/admin/downgrade', json={"userId": FAKE_USER_ID})
    assert response.status_code == 200
    assert response.json['success'] is True
    assert response.json['tier'] == 'free'
    mock_set.assert_called_once_with(FAKE_USER_ID, 'free')

def test_downgrade_user_not_found(client):
    with patch('api.setUserTier', return_value=False):
        response = client.post('/admin/downgrade', json={"userId": FAKE_USER_ID})
    assert response.status_code == 404


# =========================================
#        Recursive scan endpoint tests
# =========================================

FAKE_SCAN_ID = "11111111-1111-1111-1111-111111111111"

def test_create_recursive_scan_success(client):
    with patch('api.validate_github_url', return_value=(True, 'OK', None)), \
         patch('api.run_recursive_scan_job_free') as mock_free:
        
        mock_free.delay = MagicMock()

        response = client.post('/recursive-scan', json={
            "id": FAKE_SCAN_ID,
            "url": REPO_URL,
            "isDeepScan": False,
        })
        
    assert response.status_code == 202
    assert response.json['success'] is True
    mock_free.delay.assert_called_once_with(FAKE_SCAN_ID, REPO_URL, None, False, [])

def test_create_recursive_scan_missing_fields(client):
    response = client.post('/recursive-scan', json={"url": REPO_URL})
    assert response.status_code == 400

    response = client.post('/recursive-scan', json={"id": FAKE_SCAN_ID})
    assert response.status_code == 400

def test_create_recursive_scan_invalid_url(client):
    response = client.post('/recursive-scan', json={
        "id": FAKE_SCAN_ID,
        "url": "not-a-github-url.com"
    })
    assert response.status_code == 400