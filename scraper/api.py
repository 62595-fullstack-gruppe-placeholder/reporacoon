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

VALID_INTERVALS = {"EVERY_MINUTE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"}

app = Flask(__name__)
CORS(app)

#todo look into redis for prod
active_scans = {}
scan_results = {}


# ---- Background scheduler ----
# Runs a poll loop every 60 seconds. Any active recurring scan whose next_run_at
# has passed is picked up and executed in a daemon thread.

def run_recursive_scan(scan):
    # Called in a background thread — by the scheduler loop or the /run-now endpoint
    repo_url = scan["repo_url"]
    is_deep_scan = scan["is_deep_scan"]
    recursive_id = scan["id"]
    extensions = scan["extensions"]

    try:
        # Create a scan_job linked to this recurring schedule so the frontend can
        # query all jobs for a given recurring scan
        job_id = insertScanJob(repo_url, recursive_scan_id=recursive_id)
        scanner = GitHubSecretScanner(repo_url, job_id, is_deep_scan, extensions)

        start = time.time()
        scanner.run()  # Clones repo, runs secret detection, writes findings to DB
        end = time.time()

        insertDurationInScanJobs(math.floor(end - start), job_id)
        setParsingScanJobsToParsed([str(job_id)])  # PARSING → PARSED
        updateRecursiveScanAfterRun(recursive_id)  # Update last_run_at and advance next_run_at

        print(f"[scheduler] Recursive scan complete for {repo_url} (job {job_id})")
    except Exception as e:
        print(f"[scheduler] Error scanning {repo_url}: {e}")


def scheduler_loop():
    # Polls every 60 seconds — minimum effective resolution for any interval is ~60s
    # EVERY_MINUTE is for testing and may fire up to 60s late
    while True:
        try:
            due = getDueRecursiveScans()  # WHERE is_active = true AND next_run_at <= NOW()
            for scan in due:
                t = threading.Thread(target=run_recursive_scan, args=(scan,), daemon=True)
                t.start()
        except Exception as e:
            print(f"[scheduler] Error fetching due scans: {e}")
        time.sleep(60)


# Set DISABLE_SCHEDULER=1 to prevent the loop from starting (useful in test environments)
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
        print("STATUS:", response.status_code)
        print("BODY:", response.text)
        
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
        url = data['url']
        repoKey = data.get('repoKey')  # optional

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


#app route to start a new scan (async)
@app.route('/scan', methods=['POST'])
def start_scan():
    """Start a new scan"""
    try:
        repoKey = request.json.get("repoKey") 
        data = getAllPendingScanJobs()
        isDeepScan = request.json.get("isDeepScan", False)
        extensions = request.json.get("extensions", [])
        if not data:
            return jsonify({'success': False, 'message': 'No pending scan jobs'}), 200

        for id, url in data.items():
            is_valid, message, repo_info = validate_github_url(url)

            if not is_valid:
                return jsonify({'error': message}), 400
            
            scan_id = id
            # TODO: Add multithreading here (Main work of scanning & cloning)
            scanner = GitHubSecretScanner(url, id, isDeepScan, extensions, repoKey=repoKey)

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


# Create a new recurring scan schedule.
# Validates the URL format and interval value before writing to DB.
# Also fires off the first scan immediately so the user doesn't have to wait
# for the scheduler to pick it up on its next 60-second tick.
@app.route('/recursive-scan', methods=['POST'])
def create_recursive_scan():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'interval' not in data:
            return jsonify({'error': 'url and interval are required'}), 400

        url = data['url']
        interval = data['interval'].upper()
        is_deep_scan = data.get('isDeepScan', False)
        extensions = data.get('extensions', [])

        if interval not in VALID_INTERVALS:
            return jsonify({'error': f'interval must be one of {sorted(VALID_INTERVALS)}'}), 400

        is_valid, message, _ = validate_github_url(url)
        if not is_valid:
            return jsonify({'error': message}), 400

        scan_id, next_run_at = insertRecursiveScan(url, interval, is_deep_scan, extensions)

        # Run the first scan immediately in the background so the user sees results
        # right away without waiting for the scheduler
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


# Returns all recurring scan schedules (all users, no ownership filter — used internally)
@app.route('/recursive-scan', methods=['GET'])
def list_recursive_scans():
    try:
        scans = getAllRecursiveScans()
        for s in scans:
            # UUID and datetime objects must be serialized to strings for JSON
            s['id'] = str(s['id'])
            if s['last_run_at']:
                s['last_run_at'] = s['last_run_at'].isoformat()
            if s['next_run_at']:
                s['next_run_at'] = s['next_run_at'].isoformat()
            s['created_at'] = s['created_at'].isoformat()
        return jsonify(scans), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Permanently delete a recurring scan schedule.
# The linked scan_jobs rows are kept — their recursive_scan_id is set to NULL
# via ON DELETE SET NULL so historical results are preserved.
@app.route('/recursive-scan/<scan_id>', methods=['DELETE'])
def remove_recursive_scan(scan_id):
    try:
        deleted = deleteRecursiveScan(scan_id)
        if not deleted:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Manually trigger a scan run for a schedule without waiting for the scheduler.
# Does NOT reset or modify next_run_at — the schedule continues on its normal cadence.
# Returns 202 Accepted immediately; the scan runs in a background thread.
@app.route('/recursive-scan/<scan_id>/run-now', methods=['POST'])
def run_recursive_scan_now(scan_id):
    try:
        scans = getAllRecursiveScans()
        scan = next((s for s in scans if str(s['id']) == scan_id), None)
        if not scan:
            return jsonify({'error': 'Not found'}), 404
        threading.Thread(target=run_recursive_scan, args=(scan,), daemon=True).start()
        return jsonify({'success': True, 'message': f'Scan triggered for {scan["repo_url"]}'}), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Flip is_active on the schedule. Paused scans are skipped by the scheduler loop.
# Returns the new is_active value so the frontend can update the UI without a re-fetch.
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