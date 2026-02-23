import re
import os
import subprocess
import tempfile
import shutil
import requests
from datetime import datetime
from collections import defaultdict
from repository import *

#------------------------------- basic flow -----------------------------------------------
#  1. The API file gives the scanner a repo URL and a job ID
#  2. The scanner clones the repo
#  3. The scanner then recursively reads files from the repoand if there are any matches 
#  with our regex below, the findings will be inserted into the scan_findings table
#  4. The cloned repo is deleted again
#--------------------------------------------------------------------------------------------

class GitHubSecretScanner:
    def __init__(self, repo_url, job_id):
        self.repo_url = repo_url
        self.job_id = job_id
        self.scanned_files = 0
        self.findings = defaultdict(list)
        
        # Create a requests session for HTTP requests
        self.session = requests.Session()

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

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
            'Stripe Key': r'(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}',
            'Twilio Key': r'SK[0-9a-fA-F]{32}',
            'SendGrid Key': r'SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}',
            'Mailgun Key': r'key-[0-9a-zA-Z]{32}',
            'Algolia Key': r'(?i)(algolia|search)[\-_]?api[\-_]?key[\s]*[:=][\s]*["\']?[0-9a-zA-Z]{32}["\']?',
            'Firebase URL': r'https://[a-zA-Z0-9-]+\.firebaseio\.com',
            'JWT Token': r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}',
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
            # 'Email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', Add this later if we want
        }

    # ---------------- Logging ---------------- #

    def write_log(self, message):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)

    # ---------------- Git Clone ---------------- #

    def clone_repo(self):
        self.write_log("Cloning repository...")
        temp_dir = tempfile.mkdtemp()
        # TODO: add an option to search history and possibly more branches. History can be changed by modifying the depth flag (removing it) or adding the --mirror flag.
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", self.repo_url, temp_dir],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.write_log("Repository cloned successfully.")
            return temp_dir

        except subprocess.CalledProcessError:
            shutil.rmtree(temp_dir)
            self.write_log("Failed to clone repo")
            raise Exception("Failed to clone repository.")

    # ---------------- File Handling ---------------- #

    def is_text_file(self, filename):
        text_extensions = (
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
        )
        return filename.lower().endswith(text_extensions)

    def find_line_number(self, content, match):
        for i, line in enumerate(content.split('\n'), 1):
            if match in line:
                return i
        return 0

    # ---------------- Scanning ---------------- #

    def scan_content(self, content, file_path):
        for secret_type, pattern in self.patterns.items():
            matches = re.findall(pattern, content)

            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]

                line_number = self.find_line_number(content, match)
                # TODO: add the code snippet locating code
                # TODO: add a severity system
                insertScanFindings(self.job_id, file_path, line_number, "CODE SNIPPET GOES HERE", 'LOW', secret_type)

    def scan_repository(self, repo_path):
        # TODO: add an upper limit of files to scan
        self.write_log("Scanning files locally...")

        for root, dirs, files in os.walk(repo_path):
            for file in files:
                if not self.is_text_file(file):
                    continue

                file_path = os.path.join(root, file)

                try:
                    with open(file_path, "r", errors="ignore") as f:
                        content = f.read()

                    relative_path = os.path.relpath(file_path, repo_path)

                    self.scan_content(content, relative_path)
                    self.scanned_files += 1

                except Exception as e:
                    self.write_log(f"Error reading {file_path}: {e}")

    # ---------------- Main ---------------- #

    def run(self):
        repo_path = None

        try:
            repo_path = self.clone_repo()
            self.scan_repository(repo_path)

        finally:
            if repo_path and os.path.exists(repo_path):
                shutil.rmtree(repo_path)
                self.write_log("Temporary repository deleted.")


