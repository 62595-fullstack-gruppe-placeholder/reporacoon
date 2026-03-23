from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import json
import os
from datetime import datetime
import re
import time
import math
from urllib.parse import urlparse
import requests
from repository import *
from logic import GitHubSecretScanner

VALID_INTERVALS = {"HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"}

app = Flask(__name__)
CORS(app)

#todo look into redis for prod
active_scans = {}
scan_results = {}


# ---- Background scheduler ----

def run_recursive_scan(scan):
    repo_url = scan["repo_url"]
    is_deep_scan = scan["is_deep_scan"]
    recursive_id = scan["id"]

    try:
        job_id = insertScanJob(repo_url, recursive_scan_id=recursive_id)
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan)

        start = time.time()
        scanner.run()
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])
        updateRecursiveScanAfterRun(recursive_id)

        print(f"[scheduler] Recursive scan complete for {repo_url} (job {job_id})")
    except Exception as e:
        print(f"[scheduler] Error scanning {repo_url}: {e}")


def scheduler_loop():
    while True:
        try:
            due = getDueRecursiveScans()
            for scan in due:
                t = threading.Thread(target=run_recursive_scan, args=(scan,), daemon=True)
                t.start()
        except Exception as e:
            print(f"[scheduler] Error fetching due scans: {e}")
        time.sleep(60)


if os.environ.get("DISABLE_SCHEDULER") != "1":
    _scheduler = threading.Thread(target=scheduler_loop, daemon=True)
    _scheduler.start()



#------------------------------- list of endpoints -----------------------------------------------
# GET    /health                - Health check
# POST   /validate              - Validate GitHub URL
# POST   /scan                  - Start async scan
#--------------------------------------------------------------------------------------------------



#todo check if its github or gitlab or bitbucket etc, for now just github
def validate_github_url(url):
    github_pattern = r'^https?://(www\.)?github\.com/([^/]+)/([^/]+)/?$'
    
    match = re.match(github_pattern, url)
    
    if not match:
        return False, "Invalid GitHub repository URL format", None
    
    owner = match.group(2)
    repo = match.group(3)
    
    if repo.endswith('.git'):
        repo = repo[:-4]
    
    return True, "Valid GitHub URL", {'owner': owner, 'repo': repo}


# Check if the repository actually exists on GitHub
def check_repo_exists(owner, repo):
    url = f"https://github.com/{owner}/{repo}"
    
    try:
        response = requests.head(url, allow_redirects=False)
        
        if response.status_code == 200:
            return True, "Repository exists", {"url": url}
        elif response.status_code == 404:
            return False, "Repository not found on GitHub", None
        else:
            return False, f"Unexpected status code: {response.status_code}", None
            
    except requests.exceptions.RequestException as e:
        return False, f"Error connecting to GitHub: {str(e)}", None



#app route for health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'GitHub Secret Scanner API',
        'version': '1.0.0'
    })


#app route to validate GitHub URL without scanning
@app.route('/validate', methods=['POST'])
def validate():
    """Validate a GitHub URL without scanning"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'valid': False,
                'message': 'No URL provided'
            }), 400
        
        url = data['url']
        
        is_valid_format, format_message, repo_info = validate_github_url(url)
        
        if not is_valid_format:
            return jsonify({
                'valid': False,
                'message': format_message
            }), 400
        
        exists, exists_message, repo_details = check_repo_exists(
            repo_info['owner'], 
            repo_info['repo']
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


#app route to start a new scan (async)
@app.route('/scan', methods=['POST'])
def start_scan():
    """Start a new scan"""
    try:
        data = getAllPendingScanJobs()
        isDeepScan = request.json.get("isDeepScan", False)
        
        if not data:
            return jsonify({'success': False, 'message': 'No pending scan jobs'}), 200

        for id, url in data.items():
            is_valid, message, repo_info = validate_github_url(url)

            if not is_valid:
                return jsonify({'error': message}), 400
            
            scan_id = id
            # TODO: Add multithreading here (Main work of scanning & cloning)
            scanner = GitHubSecretScanner(url, id, isDeepScan)

            start = time.time()

            scanner.run() 

            end = time.time()

            # Adds the time taken to complete a scan job to the database
            insertDurationInScanJobs(math.floor(end-start), scan_id)

        # Updates the status of all of the parsed jobs (data.keys are the ids)
        setParsingScanJobsToParsed(list(data.keys()))

        
        finding = getScanFindingById(id)
        try:
            print(json.dumps(finding, indent=2, default=str, ensure_ascii=False))
        except Exception:
            from pprint import pprint
            pprint(finding)
        
        return jsonify({
            'success': True,
            'message': 'Scan started successfully',
            'scan_id': scan_id,
            'repo_info': repo_info,
            'status_url': f'/scan/status/{scan_id}',
            'results_url': f'/scan/results/{scan_id}'
        }), 202
        
    except Exception as e:
        print("error: " + str(e))
        return jsonify({'error': str(e)}), 500


# ---- Recursive scan endpoints ----
# POST   /recursive-scan             - Create a recurring scan schedule
# GET    /recursive-scan             - List all recurring scan schedules
# DELETE /recursive-scan/<id>        - Delete a schedule
# PATCH  /recursive-scan/<id>/toggle - Pause or resume a schedule


@app.route('/recursive-scan', methods=['POST'])
def create_recursive_scan():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'interval' not in data:
            return jsonify({'error': 'url and interval are required'}), 400

        url = data['url']
        interval = data['interval'].upper()
        is_deep_scan = data.get('isDeepScan', False)

        if interval not in VALID_INTERVALS:
            return jsonify({'error': f'interval must be one of {sorted(VALID_INTERVALS)}'}), 400

        is_valid, message, _ = validate_github_url(url)
        if not is_valid:
            return jsonify({'error': message}), 400

        scan_id, next_run_at = insertRecursiveScan(url, interval, is_deep_scan)

        # Run the first scan immediately in the background
        first_scan = {"id": scan_id, "repo_url": url, "is_deep_scan": is_deep_scan}
        threading.Thread(target=run_recursive_scan, args=(first_scan,), daemon=True).start()

        return jsonify({
            'success': True,
            'id': str(scan_id),
            'repo_url': url,
            'interval': interval,
            'is_deep_scan': is_deep_scan,
            'next_run_at': next_run_at.isoformat(),
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/recursive-scan', methods=['GET'])
def list_recursive_scans():
    try:
        scans = getAllRecursiveScans()
        for s in scans:
            s['id'] = str(s['id'])
            if s['last_run_at']:
                s['last_run_at'] = s['last_run_at'].isoformat()
            if s['next_run_at']:
                s['next_run_at'] = s['next_run_at'].isoformat()
            s['created_at'] = s['created_at'].isoformat()
        return jsonify(scans), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/recursive-scan/<scan_id>', methods=['DELETE'])
def remove_recursive_scan(scan_id):
    try:
        deleted = deleteRecursiveScan(scan_id)
        if not deleted:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/recursive-scan/<scan_id>/toggle', methods=['PATCH'])
def toggle_recursive_scan_route(scan_id):
    try:
        is_active = toggleRecursiveScan(scan_id)
        if is_active is None:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'success': True, 'is_active': is_active}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# main entry point
if __name__ == '__main__':
    print("\n" + "="*70)
    print(" GITHUB SECRET SCANNER API SERVER")
    print("="*70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nAvailable endpoints:")
    print("  GET    /health                          - Health check")
    print("  POST   /validate                        - Validate GitHub URL")
    print("  POST   /scan                            - Start async scan")
    #recursive
    print("  POST   /recursive-scan                  - Create recurring scan")
    print("  GET    /recursive-scan                  - List recurring scans")
    print("  DELETE /recursive-scan/<id>             - Delete recurring scan")
    print("  PATCH  /recursive-scan/<id>/toggle      - Pause/resume recurring scan")
    print("="*70)
    print(f"\nServer running on: http://0.0.0.0:5001")
    print("="*70 + "\n")
    

# Run the Flask app with threading enabled to allow concurrent scans
    app.run(
        host='0.0.0.0', 
        port=5001, 
        debug=False,
        threaded=True
    )