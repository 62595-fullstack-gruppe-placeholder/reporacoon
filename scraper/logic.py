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
#  3. The scanner then recursively reads files from the repo and if there are any matches 
#  with the regex below, the findings will be inserted into the scan_findings table
#  4. The cloned repo is deleted again
#--------------------------------------------------------------------------------------------

class GitHubSecretScanner:
    def __init__(self, repo_url, job_id, isDeepScan=False):
        self.repo_url = repo_url
        self.job_id = job_id
        self.scanned_files = 0
        self.findings = defaultdict(list)
        self.isDeepScan = isDeepScan
        
        # Create a requests session for HTTP requests
        self.session = requests.Session()

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Map pattern -> (regex, severity)
        self.patterns = {
            'AWS API Key': (r'AKIA[0-9A-Z]{16}', 'CRITICAL'),
            'AWS Secret Key': (r'(?i)aws[_-]?secret[_-]?access[_-]?key[\s]*[:=][\s]*["\']?[A-Za-z0-9/+=]{40}["\']?', 'CRITICAL'),
            'Private Key': (r'-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----', 'CRITICAL'),
            'Stripe Key': (r'(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}', 'CRITICAL'),
            'OpenAI API Key': (r'sk-[a-zA-Z0-9]{48,}', 'CRITICAL'),
            'OpenAI Legacy Key': (r'sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}', 'CRITICAL'),
            'Anthropic API Key': (r'sk-ant-api03-[a-zA-Z0-9_-]{40,}', 'CRITICAL'),

            'Google API Key': (r'AIza[0-9A-Za-z\-_]{35}', 'HIGH'),
            'Slack Token': (r'(xox[pborsa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})', 'HIGH'),
            'GitHub Token': (r'ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22,}|gh[oasu]_[A-Za-z0-9]{36,}', 'HIGH'),
            'MongoDB URI': (r'mongodb(\+srv)?://[^/\s]+:[^/\s]+@[^/\s]+', 'HIGH'),
            'PostgreSQL URI': (r'postgresql://[^/\s]+:[^/\s]+@[^/\s]+', 'HIGH'),
            'Telegram Bot Token': (r'[0-9]{8,10}:[a-zA-Z0-9_-]{35}', 'HIGH'),
            'Discord Bot Token': (r'[a-zA-Z0-9_-]{24}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}', 'HIGH'),
            'Hugging Face Token': (r'hf_[a-zA-Z0-9]{34,}', 'HIGH'),
            'Twilio Key': (r'SK[0-9a-fA-F]{32}', 'HIGH'),
            'SendGrid Key': (r'SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}', 'HIGH'),
            'Mailgun Key': (r'key-[0-9a-zA-Z]{32}', 'HIGH'),
            'JWT Token': (r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}', 'HIGH'),
            'MySQL URI': (r'mysql://[^/\s]+:[^/\s]+@[^/\s]+', 'HIGH'),
            'Bearer Token': (r'bearer\s+[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+', 'HIGH'),

            'Google OAuth': (r'[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com', 'MEDIUM'),
            'Generic API Key': (r'(?i)(api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token)[\s]*[:=][\s]*["\']?[a-zA-Z0-9_\-]{16,64}["\']?', 'MEDIUM'),
            'Algolia Key': (r'(?i)(algolia|search)[\-_]?api[\-_]?key[\s]*[:=][\s]*["\']?[0-9a-zA-Z]{32}["\']?', 'MEDIUM'),
            'Slack Webhook': (r'https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9]+', 'MEDIUM'),
            'Discord Webhook': (r'https://discord(?:app)?\.com/api/webhooks/[0-9]+/[a-zA-Z0-9_-]+', 'MEDIUM'),
            'NPM Token': (r'npm_[a-zA-Z0-9]{36,}', 'MEDIUM'),
            'PyPI Token': (r'pypi-[A-Za-z0-9]{40,}', 'MEDIUM'),
            'Docker Hub Token': (r'dckr_pat_[a-zA-Z0-9_-]{26,}', 'MEDIUM'),
            
            'OpenAI Org ID': (r'org-[a-zA-Z0-9]{15,}', 'LOW'),
             #IP Address are too commonly used, so it will clog the results. Should reconsider having this
             #'IP Address': (r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', 'LOW'),
            'S3 Bucket': (r'[a-zA-Z0-9\-_]{3,63}\.s3\.amazonaws\.com', 'LOW'),
            'Firebase URL': (r'https://[a-zA-Z0-9-]+\.firebaseio\.com', 'LOW'),
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
        try:
            if self.isDeepScan == True:
                # full clone with all branches and history
                subprocess.run(
                    ["git", "clone", self.repo_url, temp_dir],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            else:
                # shallow clone - only default branch
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
            '.ps1', '.bat', '.cmd', '.txt', '.rst', '.tex', '.csv',
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
        """Return (line_number, line_text) for the first line containing match.

        If not found, returns (0, '').
        """
        for i, line in enumerate(content.split('\n'), 1):
            if match in line:
                return i, line
        return 0, ""

    # ---------------- Scanning ---------------- #

    def scan_content(self, content, file_path, branch):
        for secret_type, (pattern, severity) in self.patterns.items():
            for m in re.finditer(pattern, content, flags=re.MULTILINE):
                match_text = m.group(0)
                line_number, line_text = self.find_line_number(content, match_text)
                if line_text:
                    snippet = line_text.strip()
                else:
                    snippet = match_text

                if len(snippet) > 1000:
                    snippet = snippet[:1000]

                insertScanFindings(self.job_id, file_path, line_number, snippet, severity, secret_type, branch)

    def scan_repository(self, repo_path, branch):
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

                    self.scan_content(content, relative_path, branch)
                    self.scanned_files += 1

                except Exception as e:
                    self.write_log(f"Error reading {file_path}: {e}")

    def scan_all_branches(self, repo_path):
        """
        checkout every remote branch and scan its contents.
        the repo has already been cloned with full history;
        afterwards the working copy is restored to the original branch.
        """
        # remember where we started
        proc = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        original = proc.stdout.strip()

        # collect remote branch names (skip the HEAD pointer)
        proc = subprocess.run(
            ["git", "branch", "-r"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        branches = []
        for line in proc.stdout.splitlines():
            line = line.strip()
            if "->" in line:
                continue
            if line.startswith("origin/"):
                branches.append(line.replace("origin/", ""))

        for branch in branches:
            try:
                subprocess.run(
                    ["git", "checkout", branch],
                    cwd=repo_path,
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except subprocess.CalledProcessError:
                self.write_log(f"unable to checkout branch {branch}, skipping")
                continue

            self.write_log(f"scanning branch {branch}")
            self.scan_repository(repo_path, branch)

        # restore original checkout
        subprocess.run(
            ["git", "checkout", original],
            cwd=repo_path,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    # ---------------- Main ---------------- #

    def run(self):
        repo_path = None
        print("running scanner of type: " + str(self.isDeepScan) + "which has type: " + str(type(self.isDeepScan)))
        print("running scanner of type: " + str(self.isDeepScan))

        try:
            repo_path = self.clone_repo()
            if self.isDeepScan == True:
                # scan every branch, not just the default one
                self.scan_all_branches(repo_path)
            else:
                # set scanned branch to main, as it is the only one scanned
                self.scan_repository(repo_path, branch = "main")

        finally:
            if repo_path and os.path.exists(repo_path):
                shutil.rmtree(repo_path)
                self.write_log("Temporary repository deleted.")


