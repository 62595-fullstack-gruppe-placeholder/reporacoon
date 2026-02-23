from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import json
import os
from datetime import datetime
import re
from urllib.parse import urlparse
import requests
from repository import *
from logic import GitHubSecretScanner

app = Flask(__name__)
CORS(app)

#todo look into redis for prod
active_scans = {}
scan_results = {}



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


def load_scan_results(session_dir):
    results = {
        'summary': None,
        'findings': None,
        'json_data': None
    }
    
    summary_file = os.path.join(session_dir, 'summary_report.txt')
    if os.path.exists(summary_file):
        with open(summary_file, 'r') as f:
            results['summary'] = f.read()
    
    json_file = os.path.join(session_dir, 'findings.json')
    if os.path.exists(json_file):
        with open(json_file, 'r') as f:
            results['json_data'] = json.load(f)
    
    findings_file = os.path.join(session_dir, 'findings_detailed.txt')
    if os.path.exists(findings_file):
        with open(findings_file, 'r') as f:
            results['findings'] = f.read()
    
    return results


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

        testData = getAllScanJobs()
        print(testData)
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url']
        
        is_valid, message, repo_info = validate_github_url(url)
        
        if not is_valid:
            return jsonify({'error': message}), 400

        
        scan_id = f"{repo_info['owner']}_{repo_info['repo']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        
        
        max_files = data.get('max_files', 100)
        threads = data.get('threads', 5)
        delay = data.get('delay', 0.1)
        include_gist = data.get('include_gist', False)
        token = data.get('token', os.environ.get('GITHUB_TOKEN', None))
        
        active_scans[scan_id] = {
            'status': 'starting',
            'url': url,
            'repo_info': repo_info,
            'progress': 0,
            'start_time': datetime.now().isoformat(),
            'scanned_files': 0,
            'parameters': {
                'max_files': max_files,
                'threads': threads,
                'delay': delay,
                'include_gist': include_gist
            }
        }
        

        def run_scan():
            try:
          
                active_scans[scan_id]['status'] = 'scanning'
                
            
                scanner = GitHubSecretScanner(
                    repo_url=url,
                    max_files=max_files,
                    threads=threads,
                    delay=delay,
                    include_gist=include_gist
                )
                
                if token:
                    scanner.session.headers.update({'Authorization': f'token {token}'})
                
                scanner.run()
                
                results = load_scan_results(scanner.session_dir)
                
                total_secrets = sum(len(matches) for matches in scanner.findings.values())
                
                scan_results[scan_id] = {
                    'status': 'completed',
                    'url': url,
                    'repo_info': repo_info,
                    'scan_summary': {
                        'files_scanned': scanner.scanned_files,
                        'secrets_found': total_secrets,
                        'findings_by_type': {k: len(v) for k, v in scanner.findings.items()}
                    },
                    'session_dir': scanner.session_dir,
                    'start_time': active_scans[scan_id]['start_time'],
                    'completion_time': datetime.now().isoformat(),
                    'results': results
                }
                
                active_scans.pop(scan_id, None)
                
            except Exception as e:
                error_info = {
                    'status': 'failed',
                    'url': url,
                    'error': str(e),
                    'start_time': active_scans[scan_id]['start_time'],
                    'completion_time': datetime.now().isoformat()
                }
                
                if scan_id in active_scans:
                    active_scans[scan_id] = error_info
                else:
                    scan_results[scan_id] = error_info
        
        thread = threading.Thread(target=run_scan)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Scan started successfully',
            'scan_id': scan_id,
            'repo_info': repo_info,
            'status_url': f'/scan/status/{scan_id}',
            'results_url': f'/scan/results/{scan_id}'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# main entry point
if __name__ == '__main__':
    print("\n" + "="*70)
    print(" GITHUB SECRET SCANNER API SERVER")
    print("="*70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nAvailable endpoints:")
    print("  GET    /health              - Health check")
    print("  POST   /validate             - Validate GitHub URL")
    print("  POST   /scan                  - Start async scan")
    print("  POST   /scan/quick            - Quick sync scan")
    print("  GET    /scan/status/<id>      - Get scan status")
    print("  GET    /scan/results/<id>     - Get scan results")
    print("  GET    /scans                 - List all scans")
    print("  DELETE /scan/<id>             - Cancel scan")
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