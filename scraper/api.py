from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import json
import os
from datetime import datetime
import re
from urllib.parse import urlparse

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
# POST   /scan/quick            - Quick sync scan
# GET    /scan/status/<id>      - Get scan status
# GET    /scan/results/<id>     - Get scan results
# GET    /scans                 - List all scans
# DELETE /scan/<id>             - Cancel scan
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
    import requests
    try:
        response = requests.get(f'https://api.github.com/repos/{owner}/{repo}')
        if response.status_code == 200:
            repo_data = response.json()
            return True, "Repository exists", {
                'name': repo_data['name'],
                'full_name': repo_data['full_name'],
                'description': repo_data['description'],
                'stars': repo_data['stargazers_count'],
                'forks': repo_data['forks_count'],
                'url': repo_data['html_url'],
                'default_branch': repo_data.get('default_branch', 'main'),
                'private': repo_data.get('private', False),
                'created_at': repo_data.get('created_at'),
                'updated_at': repo_data.get('updated_at')
            }
        elif response.status_code == 404:
            return False, "Repository not found on GitHub", None
        else:
            return False, f"GitHub API error: {response.status_code}", None
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
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url']
        
        is_valid, message, repo_info = validate_github_url(url)
        
        if not is_valid:
            return jsonify({'error': message}), 400
        

        exists, exists_message, repo_details = check_repo_exists(
            repo_info['owner'],
            repo_info['repo']
        )
        
        if not exists:
            return jsonify({'error': exists_message}), 404
        
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
            'repo_details': repo_details,
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
                    'repo_details': repo_details,
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
            'repo_details': repo_details,
            'status_url': f'/scan/status/{scan_id}',
            'results_url': f'/scan/results/{scan_id}'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500











#app route to get scan status
@app.route('/scan/status/<scan_id>', methods=['GET'])
def get_scan_status(scan_id):
    """Get the status of a scan"""
    if scan_id in active_scans:
        return jsonify(active_scans[scan_id])
    elif scan_id in scan_results:
        result = scan_results[scan_id].copy()
        if 'results' in result:
            result['results'] = {'available': True, 'url': f'/scan/results/{scan_id}'}
        return jsonify(result)
    else:
        return jsonify({'error': 'Scan not found'}), 404







#app route to get full results of a completed scan
@app.route('/scan/results/<scan_id>', methods=['GET'])
def get_scan_results(scan_id):
    """Get the full results of a completed scan"""
    if scan_id in scan_results:
        return jsonify(scan_results[scan_id])
    elif scan_id in active_scans:
        return jsonify({
            'status': active_scans[scan_id]['status'],
            'message': 'Scan still in progress',
            'scan_info': active_scans[scan_id]
        }), 202
    else:
        return jsonify({'error': 'Scan not found'}), 404










#app route to list all scans (active and completed)
@app.route('/scans', methods=['GET'])
def list_scans():
    #list all scans (active and completed)
    active_list = {}
    for scan_id, info in active_scans.items():
        active_list[scan_id] = {
            'status': info.get('status'),
            'url': info.get('url'),
            'start_time': info.get('start_time'),
            'repo_info': info.get('repo_info')
        }
    
    completed_list = {}
    for scan_id, info in scan_results.items():
        completed_list[scan_id] = {
            'status': info.get('status'),
            'url': info.get('url'),
            'start_time': info.get('start_time'),
            'completion_time': info.get('completion_time'),
            'repo_info': info.get('repo_info'),
            'secrets_found': info.get('scan_summary', {}).get('secrets_found', 0) if info.get('status') == 'completed' else None
        }
    
    return jsonify({
        'active_scans': active_list,
        'completed_scans': completed_list,
        'total_active': len(active_list),
        'total_completed': len(completed_list)
    })










#app route to cancel a scan (can't actually stop the thread, just mark as cancelled)
@app.route('/scan/<scan_id>', methods=['DELETE'])
def cancel_scan(scan_id):
    if scan_id in active_scans:
        if active_scans[scan_id]['status'] == 'scanning':
            active_scans[scan_id]['status'] = 'cancelled'
            active_scans[scan_id]['completion_time'] = datetime.now().isoformat()
            
            # Move to results with cancelled status
            scan_results[scan_id] = active_scans.pop(scan_id)
            
            return jsonify({'message': 'Scan cancelled successfully'})
        else:
            return jsonify({'message': f'Scan is already {active_scans[scan_id]["status"]}'}), 400
    else:
        return jsonify({'error': 'Scan not found'}), 404







#app route for quick scan (synchronous, returns results immediately)
@app.route('/scan/quick', methods=['POST'])
def quick_scan():
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url']
        
        is_valid, message, repo_info = validate_github_url(url)
        
        if not is_valid:
            return jsonify({'error': message}), 400
        
        exists, exists_message, repo_details = check_repo_exists(
            repo_info['owner'],
            repo_info['repo']
        )
        
        if not exists:
            return jsonify({'error': exists_message}), 404
        
        scanner = GitHubSecretScanner(
            repo_url=url,
            max_files=data.get('max_files', 50),
            threads=data.get('threads', 3),
            delay=data.get('delay', 0.1),
            include_gist=data.get('include_gist', False)
        )
        
        token = data.get('token', os.environ.get('GITHUB_TOKEN', None))
        if token:
            scanner.session.headers.update({'Authorization': f'token {token}'})
        
        scanner.run()
        
        results = load_scan_results(scanner.session_dir)
        
        total_secrets = sum(len(matches) for matches in scanner.findings.values())
        
        return jsonify({
            'success': True,
            'url': url,
            'repo_info': repo_info,
            'repo_details': repo_details,
            'scan_summary': {
                'files_scanned': scanner.scanned_files,
                'secrets_found': total_secrets,
                'findings_by_type': {k: len(v) for k, v in scanner.findings.items()}
            },
            'session_dir': scanner.session_dir,
            'completion_time': datetime.now().isoformat(),
            'results': results
        }), 200
        
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