from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import re
import requests
from repository import *
from tasks import run_scan_job_pro, run_scan_job_free, run_recursive_scan_job_pro, run_recursive_scan_job_free

VALID_INTERVALS = {"EVERY_MINUTE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"}

app = Flask(__name__)
CORS(app)

#------------------------------- list of endpoints -----------------------------------------------
# GET    /health                - Health check
# POST   /validate              - Validate GitHub URL
# POST   /scan                  - Start async scan
# POST   /recursive-scan        - Trigger a recursive scan run
#--------------------------------------------------------------------------------------------------

# Validate if it's a GitHub URL format
def validate_github_url(url):
    github_pattern = r'^https?://(www\.)?github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$'
    match = re.match(github_pattern, url)

    if not match:
        return False, "Invalid GitHub repository URL format", None

    owner = match.group(2)
    repo = match.group(3)

    return True, "Valid GitHub URL", {'owner': owner, 'repo': repo}

# Check if the repository actually exists on GitHub
def check_repo_exists(owner, repo, repoKey=None):
    url = f"https://api.github.com/repos/{owner}/{repo}"
    
    headers = {"Accept": "application/vnd.github+json"}
    if repoKey:
        headers["Authorization"] = f"Bearer {repoKey}"
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return True, "Repository exists", {"url": f"https://github.com/{owner}/{repo}"}
        elif response.status_code == 404:
            return False, "Repository not found or no access", None
        elif response.status_code == 401:
            return False, "Invalid or expired access token", None
        else:
            return False, f"Unexpected status code: {response.status_code}", None
            
    except requests.exceptions.RequestException as e:
        return False, f"Error connecting to GitHub: {str(e)}", None

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'GitHub Secret Scanner API',
        'version': '1.0.0'
    })

# Validate GitHub URL without scanning
@app.route('/validate', methods=['POST'])
def validate():
    """Validate a GitHub URL without scanning"""
    try:
        data = request.get_json()

        if not data or not isinstance(data, dict) or 'url' not in data:
            return jsonify({'valid': False, 'message': 'No URL provided'}), 400

        url = data['url']
        repoKey = data.get('repoKey')

        is_valid_format, format_message, repo_info = validate_github_url(url)
        if not is_valid_format:
            return jsonify({'valid': False, 'message': format_message}), 400

        exists, exists_message, repo_details = check_repo_exists(
            repo_info['owner'],
            repo_info['repo'],
            repoKey=repoKey
        )
        
        if not exists:
            return jsonify({
                'valid': False,
                'message': exists_message,
                'repo_info': repo_info
            }), 404
        
        return jsonify({
            'valid': True,
            'message': 'Valid GitHub repository',
            'repo_info': repo_info,
            'repo_details': repo_details
        }), 200
        
    except Exception as e:
        return jsonify({
            'valid': False,
            'message': f'Server error: {str(e)}'
        }), 500


# Start a standard async scan
@app.route('/scan', methods=['POST'])
def start_scan():
    """Start a new scan dictated by Next.js"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data or 'id' not in data:
            return jsonify({'error': 'url and id are required'}), 400

        job_id = data['id']
        url = data['url']
        repoKey = data.get("repoKey") 
        is_deep_scan = data.get("isDeepScan", False)
        extensions = data.get("extensions", [])
        user_id = data.get("userId")

        # Route to correct Celery queue based on tier
        tier = getUserTier(user_id) if user_id else "free"
        task = run_scan_job_pro if tier == "pro" else run_scan_job_free

        # Fire and forget to Celery
        task.delay(job_id, url, is_deep_scan, extensions, repoKey)

        return jsonify({
            'success': True,
            'message': 'Scan queued successfully',
            'scan_id': job_id
        }), 202
        
    except Exception as e:
        print("error: " + str(e))
        return jsonify({'error': str(e)}), 500


# ---- Recursive scan endpoints ----

# Trigger a recurring scan. 
# Next.js handles DB insertions and scheduling; this endpoint just pushes to the queue.
@app.route('/recursive-scan', methods=['POST'])
def create_recursive_scan():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'id' not in data:
            return jsonify({'error': 'url and id are required'}), 400

        scan_id = data['id']  # Expecting the DB ID provided by Next.js
        url = data['url']
        repoKey = data.get('repoKey')
        is_deep_scan = data.get('isDeepScan', False)
        extensions = data.get('extensions', [])
        owner_id = data.get('owner_id')

        # Validate URL format before queueing
        is_valid, message, _ = validate_github_url(url)
        if not is_valid:
            return jsonify({'error': message}), 400

        # Enqueue via Celery based on tier
        tier = getUserTier(owner_id) if owner_id else "free"
        task = run_recursive_scan_job_pro if tier == "pro" else run_recursive_scan_job_free
        
        task.delay(
            scan_id,
            url,
            repoKey,
            is_deep_scan,
            extensions,
        )

        return jsonify({'success': True, 'message': 'Recursive scan queued', 'id': str(scan_id)}), 202

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---- Mock tier endpoints ----

@app.route('/admin/upgrade', methods=['POST'])
def upgrade_user():
    try:
        data = request.get_json()
        if not data or 'userId' not in data:
            return jsonify({'error': 'userId is required'}), 400
        updated = setUserTier(data['userId'], 'pro')
        if not updated:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'success': True, 'userId': data['userId'], 'tier': 'pro'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/admin/downgrade', methods=['POST'])
def downgrade_user():
    try:
        data = request.get_json()
        if not data or 'userId' not in data:
            return jsonify({'error': 'userId is required'}), 400
        updated = setUserTier(data['userId'], 'free')
        if not updated:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'success': True, 'userId': data['userId'], 'tier': 'free'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Main entry point
if __name__ == '__main__':
    print("\n" + "="*70)
    print(" GITHUB SECRET SCANNER API SERVER")
    print("="*70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nAvailable endpoints:")
    print("  GET    /health                          - Health check")
    print("  POST   /validate                        - Validate GitHub URL")
    print("  POST   /scan                            - Start standard scan")
    print("  POST   /recursive-scan                  - Trigger a recursive scan")
    print("="*70)
    print(f"\nServer running on: http://0.0.0.0:5001")
    print("="*70 + "\n")
    
    app.run(
        host='0.0.0.0', 
        port=5001, 
        debug=False,
        threaded=True
    )