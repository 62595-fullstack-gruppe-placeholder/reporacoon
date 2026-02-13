import re
import requests
import argparse
from urllib.parse import urlparse
from collections import defaultdict
import json
import time
import base64
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import warnings
warnings.filterwarnings('ignore')




#------------------------------- basic flow -----------------------------------------------
# 1. Asks for a GitHub URL to scan
#   Shows a warning about ethical use and requires confirmation (prolly not needed in backend but just in case)
#   Creates a scanlogs folder to store all results
#
# 2. Creates a unique folder for this specific scan (named after the repository and timestamp)
#    Sets up the list of secret patterns to look for (AWS keys, GitHub tokens, API keys, etc.)
#
# 3. Fetches basic information about the repository (name, default branch, stars, forks)
#    Gets a list of branches in the repository (up to 3 branches)
#
# 4. Starts scanning from the root directory
#    goes through folders recursively (up to 5 levels deep)
#    For each file:
#       Checks if it's a text file worth scanning
#       Downloads the file content
#       Scans the content for any secret patterns
#       If secrets are found, saves details about where and what was found
#    Respects limits (max files, delay between requests)
#
# 5. After scanning, creates several reports in the scan folder (should be in .gitignore):
#    A summary report listing what was found
#    A detailed JSON file with all findings
#    A CSV file for spreadsheets
#    A log file with all scan activity
#
# 6. Prints a final summary to the console with key stats and where to find the reports
#--------------------------------------------------------------------------------------------





class GitHubSecretScanner:
    def __init__(self, repo_url, max_files=100, threads=5, delay=0.1, include_gist=False):
        self.repo_url = repo_url
        self.max_files = max_files
        self.threads = threads
        self.delay = delay
        self.include_gist = include_gist
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'GitHub-Secret-Scanner/1.0',
            'Accept': 'application/vnd.github.v3+json'
        })
        
        self.scanlogs_dir = os.path.join(os.getcwd(), 'scanlogs')
        os.makedirs(self.scanlogs_dir, exist_ok=True)
        
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')   
        repo_name = self.extract_repo_name(repo_url)
        self.session_dir = os.path.join(self.scanlogs_dir, f"{repo_name}_{self.timestamp}")
        os.makedirs(self.session_dir, exist_ok=True)
        
        self.findings = defaultdict(list)
        self.scanned_files = 0
        self.repo_info = {}
        self.scan_log = []
        
        self.patterns = {
            'AWS API Key': r'AKIA[0-9A-Z]{16}',
            'AWS Secret Key': r'(?i)aws[_-]?secret[_-]?access[_-]?key[\s]*[:=][\s]*["\']?[A-Za-z0-9/+=]{40}["\']?',
            'Google API Key': r'AIza[0-9A-Za-z\-_]{35}',
            'Google OAuth': r'[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com',
            'Slack Token': r'(xox[pborsa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})',
            'GitHub Token': r'ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22,}|gh[oasu]_[A-Za-z0-9]{36,}',
            'Generic API Key': r'(?i)(api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token)[\s]*[:=][\s]*["\']?[a-zA-Z0-9_\-]{16,64}["\']?',
            'Bearer Token': r'bearer\s+[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+',
            'Private Key': r'-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----',
            'MongoDB URI': r'mongodb(\+srv)?://[^/\s]+:[^/\s]+@[^/\s]+',
            'MySQL URI': r'mysql://[^/\s]+:[^/\s]+@[^/\s]+',
            'PostgreSQL URI': r'postgresql://[^/\s]+:[^/\s]+@[^/\s]+',
            'Redis URI': r'redis://[^:]+:[^@]+@[^/\s]+',
            'Stripe Key': r'(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}',
            'Twilio Key': r'SK[0-9a-fA-F]{32}',
            'SendGrid Key': r'SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}',
            'Mailgun Key': r'key-[0-9a-zA-Z]{32}',
            'Algolia Key': r'(?i)(algolia|search)[\-_]?api[\-_]?key[\s]*[:=][\s]*["\']?[0-9a-zA-Z]{32}["\']?',
            'Firebase URL': r'https://[a-zA-Z0-9-]+\.firebaseio\.com',
            'JWT Token': r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}',
            'Password in URL': r'https?://[^:]+:[^@]+@',
            'S3 Bucket': r'[a-zA-Z0-9\-_]{3,63}\.s3\.amazonaws\.com',
            'Slack Webhook': r'https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9]+',
            'Discord Webhook': r'https://discord(?:app)?\.com/api/webhooks/[0-9]+/[a-zA-Z0-9_-]+',
            'OpenAI API Key': r'sk-[a-zA-Z0-9]{48,}',
            'OpenAI Legacy Key': r'sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}',
            'OpenAI Org ID': r'org-[a-zA-Z0-9]{15,}',
            'Anthropic API Key': r'sk-ant-api03-[a-zA-Z0-9_-]{40,}',
            'Hugging Face Token': r'hf_[a-zA-Z0-9]{34,}',
            'NPM Token': r'npm_[a-zA-Z0-9]{36,}',
            'PyPI Token': r'pypi-[A-Za-z0-9]{40,}',
            'Docker Hub Token': r'dckr_pat_[a-zA-Z0-9_-]{26,}',
            'Telegram Bot Token': r'[0-9]{8,10}:[a-zA-Z0-9_-]{35}',
            'Discord Bot Token': r'[a-zA-Z0-9_-]{24}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}',
            'IP Address': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
            'Email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        }
        
        self.log_file = os.path.join(self.session_dir, 'scan.log')
        self.write_log(f"=== GitHub Secret Scanner Started ===")
        self.write_log(f"Target: {repo_url}")
        self.write_log(f"Session directory: {self.session_dir}")
        self.write_log(f"Max files: {max_files}, Threads: {threads}")
        self.write_log("="*50)

    def extract_repo_name(self, url):
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) >= 2:
            return f"{path_parts[0]}_{path_parts[1].replace('.git', '')}"
        return f"scan_{self.timestamp}"

    def write_log(self, message):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        self.scan_log.append(log_entry)
        
        with open(self.log_file, 'a') as f:
            f.write(log_entry + '\n')



    def write_finding(self, finding):
        """Write individual finding to findings file"""
        findings_file = os.path.join(self.session_dir, 'findings_detailed.txt')
        with open(findings_file, 'a') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"SECRET FOUND: {finding['type']}\n")
            f.write(f"{'='*60}\n")
            f.write(f"File: {finding['file_path']}\n")
            f.write(f"Line: {finding['line_number']}\n")
            f.write(f"URL: {finding['file_url']}\n")
            f.write(f"Match: {finding['match']}\n")
            f.write(f"Timestamp: {finding['timestamp']}\n")
            f.write(f"{'='*60}\n\n")


    def parse_github_url(self, url):
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        
        if len(path_parts) >= 2:
            owner = path_parts[0]
            repo = path_parts[1].replace('.git', '')
            return owner, repo
        else:
            raise ValueError("Invalid GitHub URL format")

    def get_repo_info(self, owner, repo):
        """Get repository information from GitHub API"""
        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            response = self.session.get(api_url)
            if response.status_code == 200:
                self.repo_info = response.json()
                self.write_log(f"Repository: {self.repo_info.get('full_name')}")
                self.write_log(f"Default branch: {self.repo_info.get('default_branch')}")
                self.write_log(f"Private: {self.repo_info.get('private')}")
                self.write_log(f"Stars: {self.repo_info.get('stargazers_count')}")
                self.write_log(f"Forks: {self.repo_info.get('forks_count')}")
                return True
            else:
                self.write_log(f"Failed to fetch repo info: {response.status_code}")
                return False
        except Exception as e:
            self.write_log(f"Error fetching repo info: {e}")
            return False

    def get_repo_contents(self, owner, repo, path='', branch=None):
        """Get contents of a repository path"""
        if not branch:
            branch = self.repo_info.get('default_branch', 'main')
        
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"
        
        try:
            response = self.session.get(api_url)
            if response.status_code == 200:
                return response.json()
            else:
                return []
        except Exception as e:
            self.write_log(f"Failed to fetch contents at {path}: {e}")
            return []


    def is_text_file(self, filename):
        """Check if file should be scanned based on extension"""
        text_extensions = [
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php',
            '.html', '.htm', '.xml', '.json', '.yml', '.yaml', '.toml', '.ini',
            '.cfg', '.conf', '.config', '.env', '.sh', '.bash', '.zsh', '.fish',
            '.ps1', '.bat', '.cmd', '.txt', '.md', '.rst', '.tex', '.csv',
            '.sql', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
            '.swift', '.kt', '.kts', '.rs', '.scala', '.clj', '.elm',
            '.ex', '.exs', '.erl', '.hrl', '.hs', '.lhs', '.lua', '.pl',
            '.pm', '.r', '.R', '.dart', '.fs', '.fsx', '.fsi', '.fsscript',
            '.dockerfile', 'Dockerfile', '.gitignore', '.gitattributes',
            '.npmrc', '.yarnrc', '.piprc', '.pypirc', '.gemrc', '.bowerrc',
            '.eslintrc', '.prettierrc', '.babelrc', '.editorconfig',
            'Makefile', 'CMakeLists.txt', 'build.gradle', 'pom.xml',
            'package.json', 'package-lock.json', 'yarn.lock', 'Gemfile',
            'Podfile', 'Cargo.toml', 'go.mod', 'requirements.txt',
            'Pipfile', 'Pipfile.lock', 'environment.yml', 'setup.py'
        ]
        
        for ext in text_extensions:
            if filename.lower().endswith(ext.lower()) or filename == ext:
                return True
        return False





# scan file content for secrets using regex patterns
    def scan_content(self, content, file_path, file_url):
        results = defaultdict(list)
        
        for secret_type, pattern in self.patterns.items():
            matches = re.findall(pattern, str(content))
            if matches:
                for i, match in enumerate(matches[:10]):
                    if isinstance(match, tuple):
                        match = match[0] if match else match
                    
                    if match and len(str(match)) > 8:
                        masked_match = self.mask_secret(str(match))
                        line_number = self.find_line_number(content, str(match))
                        
                        finding = {
                            'match': masked_match,
                            'full_match': str(match)[:8] + '...' + str(match)[-8:] if len(str(match)) > 16 else '***MASKED***',
                            'file_path': file_path,
                            'file_url': file_url,
                            'line_number': line_number,
                            'type': secret_type,
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        results[secret_type].append(finding)
                        self.write_finding(finding)
                        
                        self.write_log(f"FOUND {secret_type} in {file_path}:{line_number}")
        
        return results




    def find_line_number(self, content, match_string):
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if match_string in line:
                return i
        return 0
    



    def mask_secret(self, secret):
        """Mask sensitive data for safe display"""
        if len(secret) <= 8:
            return '***MASKED***'
        return secret[:4] + '...' + secret[-4:]

    def scan_file(self, file_info, owner, repo, branch):
        try:
            file_path = file_info.get('path', '')
            file_name = file_info.get('name', '')
            download_url = file_info.get('download_url')
            html_url = file_info.get('html_url', f"https://github.com/{owner}/{repo}/blob/{branch}/{file_path}")
            
            if not self.is_text_file(file_name):
                return
            
            if download_url:
                response = self.session.get(download_url, timeout=10)
                if response.status_code == 200:
                    content = response.text
                    results = self.scan_content(content, file_path, html_url)
                    
                    for secret_type, matches in results.items():
                        self.findings[secret_type].extend(matches)
                    
                    self.scanned_files += 1
                    
                    # Log progress
                    if self.scanned_files % 10 == 0:
                        self.write_log(f"Progress: Scanned {self.scanned_files} files")
                        
        except Exception as e:
            self.write_log(f"Error scanning {file_path}: {e}")

    def scan_directory(self, owner, repo, path='', branch=None, depth=0):
        if depth > 5:
            return
        
        if self.scanned_files >= self.max_files:
            return
        
        contents = self.get_repo_contents(owner, repo, path, branch)
        
        if not contents:
            return
        
        for item in contents:
            if self.scanned_files >= self.max_files:
                break
                
            if isinstance(item, dict):
                item_type = item.get('type')
                
                if item_type == 'file':
                    self.scan_file(item, owner, repo, branch)
                    time.sleep(self.delay)
                
                elif item_type == 'dir':
                    self.scan_directory(owner, repo, item.get('path'), branch, depth + 1)





    def scan_branch(self, owner, repo, branch):
        self.write_log(f"Scanning branch: {branch}")
        self.scan_directory(owner, repo, '', branch)

    def scan_repo(self, owner, repo):
        self.write_log(f"\n{'='*70}")
        self.write_log(f"SCANNING REPOSITORY: {owner}/{repo}")
        self.write_log(f"{'='*70}")
        
        if not self.get_repo_info(owner, repo):
            return
        
        branches_url = f"https://api.github.com/repos/{owner}/{repo}/branches"
        try:
            response = self.session.get(branches_url)
            if response.status_code == 200:
                branches = response.json()
                branch_names = [b['name'] for b in branches[:3]]
                
                default_branch = self.repo_info.get('default_branch', 'main')
                self.scan_branch(owner, repo, default_branch)
                
                for branch in branch_names:
                    if branch != default_branch and self.scanned_files < self.max_files:
                        self.scan_branch(owner, repo, branch)
                        
        except Exception as e:
            self.write_log(f"Failed to fetch branches: {e}")
            default_branch = self.repo_info.get('default_branch', 'main')
            self.scan_branch(owner, repo, default_branch)

    def scan_github_url(self):
        """Parse GitHub URL and scan the repository"""
        try:
            if 'gist.github.com' in self.repo_url and self.include_gist:
                self.scan_gist()
            else:
                owner, repo = self.parse_github_url(self.repo_url)
                self.scan_repo(owner, repo)
        except ValueError as e:
            self.write_log(f"Error: {e}")
        except Exception as e:
            self.write_log(f"Failed to scan repository: {e}")

    def scan_gist(self):
        """Scan GitHub Gist"""
        parsed = urlparse(self.repo_url)
        path_parts = parsed.path.strip('/').split('/')
        
        if len(path_parts) >= 2:
            gist_id = path_parts[1]
            api_url = f"https://api.github.com/gists/{gist_id}"
            
            try:
                response = self.session.get(api_url)
                if response.status_code == 200:
                    gist_data = response.json()
                    self.write_log(f"Scanning Gist: {gist_data.get('description', 'No description')}")
                    
                    for filename, file_data in gist_data.get('files', {}).items():
                        content = file_data.get('content', '')
                        raw_url = file_data.get('raw_url', '')
                        
                        if content and self.is_text_file(filename):
                            results = self.scan_content(content, filename, raw_url)
                            
                            for secret_type, matches in results.items():
                                self.findings[secret_type].extend(matches)
                                
            except Exception as e:
                self.write_log(f"Failed to scan gist: {e}")

    def generate_report(self, elapsed_time):
        report_file = os.path.join(self.session_dir, 'summary_report.txt')
        json_file = os.path.join(self.session_dir, 'findings.json')
        csv_file = os.path.join(self.session_dir, 'findings.csv')
        
        with open(report_file, 'w') as f:
            f.write("\n" + "="*70 + "\n")
            f.write(" GITHUB SECRET SCANNER - SUMMARY REPORT\n")
            f.write("="*70 + "\n")
            f.write(f"Target: {self.repo_url}\n")
            f.write(f"Scan Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Files scanned: {self.scanned_files}\n")
            f.write(f"Time elapsed: {elapsed_time:.2f} seconds\n")
            f.write("\nSECRETS FOUND:\n")
            
            if not self.findings:
                f.write("  No secrets detected\n")
            else:
                total_secrets = sum(len(matches) for matches in self.findings.values())
                f.write(f"  Total secrets found: {total_secrets}\n")
                f.write("\n" + "-"*70 + "\n")
                
                for secret_type, matches in sorted(self.findings.items(), key=lambda x: len(x[1]), reverse=True):
                    f.write(f"\n{secret_type}: {len(matches)} found\n")
                    unique_files = set(match['file_path'] for match in matches[:10])
                    for i, match in enumerate(matches[:5]):
                        f.write(f"   {i+1}. {match['match']} - {match['file_path']}:{match['line_number']}\n")
                    if len(matches) > 5:
                        f.write(f"   ... and {len(matches)-5} more\n")
                    if len(unique_files) > 5:
                        f.write(f"   Spread across {len(unique_files)} files\n")

        serializable_findings = {}
        for key, matches in self.findings.items():
            serializable_findings[key] = [
                {k: v for k, v in match.items() if k != 'full_match'} 
                for match in matches
            ]
        
        with open(json_file, 'w') as f:
            json.dump({
                'scan_info': {
                    'target': self.repo_url,
                    'timestamp': datetime.now().isoformat(),
                    'session_dir': self.session_dir,
                    'files_scanned': self.scanned_files,
                    'elapsed_time': elapsed_time,
                    'total_secrets': total_secrets if self.findings else 0
                },
                'repo_info': self.repo_info,
                'findings': serializable_findings
            }, f, indent=2)
        
        import csv
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Secret Type', 'File Path', 'Line Number', 'Match', 'URL', 'Timestamp'])
            
            for secret_type, matches in self.findings.items():
                for match in matches:
                    writer.writerow([
                        secret_type,
                        match['file_path'],
                        match['line_number'],
                        match['match'],
                        match['file_url'],
                        match['timestamp']
                    ])
        
        self.write_log(f"\n{'='*70}")
        self.write_log("SCAN COMPLETED")
        self.write_log(f"Files scanned: {self.scanned_files}")
        self.write_log(f"Secrets found: {total_secrets if self.findings else 0}")
        self.write_log(f"Time elapsed: {elapsed_time:.2f} seconds")
        self.write_log(f"\nReports saved to: {self.session_dir}")
        self.write_log(f"  - Summary report: summary_report.txt")
        self.write_log(f"  - Detailed findings: findings_detailed.txt")
        self.write_log(f"  - JSON export: findings.json")
        self.write_log(f"  - CSV export: findings.csv")
        self.write_log(f"  - Scan log: scan.log")
        self.write_log("="*70)
        
        print(f"\n{'='*70}")
        print(" SCAN COMPLETED - RESULTS SAVED TO /scanlogs")
        print('='*70)
        print(f"Session directory: {self.session_dir}")
        print(f"Files scanned: {self.scanned_files}")
        print(f"Secrets found: {total_secrets if self.findings else 0}")
        print(f"\nReports saved:")
        print(f"  • {report_file}")
        print(f"  • {json_file}")
        print(f"  • {csv_file}")
        print(f"  • {self.log_file}")
        print('='*70)

    def run(self):
        """Main scanning function"""
        start_time = time.time()
        
        try:
            self.scan_github_url()
        except KeyboardInterrupt:
            self.write_log("\nScan interrupted by user")
            print("\nScan interrupted by user")
        except Exception as e:
            self.write_log(f"\nError: {str(e)}")
            print(f"\nError: {str(e)}")
        
        elapsed_time = time.time() - start_time
        self.generate_report(elapsed_time)

def main():
    parser = argparse.ArgumentParser(description='Scan GitHub repositories for exposed API keys and secrets')
    parser.add_argument('url', help='GitHub repository URL to scan (e.g., https://github.com/owner/repo)')
    parser.add_argument('--max-files', type=int, default=100, help='Maximum files to scan (default: 100)')
    parser.add_argument('--threads', type=int, default=5, help='Number of threads (default: 5)')
    parser.add_argument('--delay', type=float, default=0.1, help='Delay between requests (default: 0.1s)')
    parser.add_argument('--branch', help='Specific branch to scan (optional)')
    parser.add_argument('--include-gist', action='store_true', help='Include GitHub Gist scanning')
    parser.add_argument('--token', help='GitHub API token for higher rate limits')
    parser.add_argument('--output', help='Output file for results (optional)')
    
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print(" WARNING: Only scan repositories you own or have permission to test!")
    print(" Unauthorized scanning may violate GitHub's Terms of Service.")
    print("="*70 + "\n")
    
    confirm = input("Do you have permission to scan this target? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Scan cancelled.")
        return
    
    scanner = GitHubSecretScanner(
        repo_url=args.url,
        max_files=args.max_files,
        threads=args.threads,
        delay=args.delay,
        include_gist=args.include_gist
    )
    
    
    if args.token:
        scanner.session.headers.update({'Authorization': f'token {args.token}'})
    
    scanner.run()


if __name__ == "__main__":
    main()