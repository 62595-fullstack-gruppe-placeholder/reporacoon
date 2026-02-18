import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app

def test_health_check():
    """Simple test to ensure Flask is set up correctly"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json['status'] == 'ok'