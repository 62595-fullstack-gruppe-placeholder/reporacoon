import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app

# =========================================
#             Endpoint tests
# =========================================

# Test that flask is set up correctly
def test_health_check():
    app.config['TESTING'] = True
    with app.test_client() as client:
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json['status'] == 'ok'

# Test the validate endpoint works correctly with status 200 or that
# it returns 400 for invalid URL, 404 for no URL, and 500 for 
# server errors
def test_validate_endpoint():
    pass

# Test the scan endpoint works correctly with status 202 or
# that it returns 400 for invalid or missing URLs and 500 for other exceptions
def test_scan_endpoint():
    pass
