import re
import os
import subprocess
import tempfile
import shutil
import requests
import math
from datetime import datetime
from collections import defaultdict
from repository import *
import json
from pathlib import Path
#------------------------------- basic flow -----------------------------------------------
#  1. The API file gives the scanner a repo URL and a job ID
#  2. The scanner clones the repo
#  3. The scanner then recursively reads files from the repo and if there are any matches 
#  with the regex below, the findings will be inserted into the scan_findings table
#  4. The cloned repo is deleted again
#--------------------------------------------------------------------------------------------

config_path = Path('/app/ignoreSettingsConfig.json')


# getting file extensions from json file incase none are given
try:
    with open(config_path, 'r') as f:
        defaultExtensions = json.load(f)
        defaultExtensions = defaultExtensions['settings']
except Exception as e:
    # If it fails, fallback to these values
    defaultExtensions =  [".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php",
    ".html", ".htm", ".xml", ".json", ".yml", ".yaml", ".toml", ".ini",
    ".cfg", ".conf", ".config", ".env", ".sh", ".bash", ".zsh", ".fish",
    ".ps1", ".bat", ".cmd", ".txt", ".rst", ".tex", ".csv", ".sql"]
    print(f"JSON Erroasdr: {e}")

class GitHubSecretScanner:
    def __init__(self, repo_url, job_id, isDeepScan=False, extensions=defaultExtensions):
        self.repo_url = repo_url
        self.job_id = job_id
        self.scanned_files = 0
        self.findings = defaultdict(list)
        self.isDeepScan = isDeepScan
        self.extensions = extensions
        self.entropy_candidate_pattern = re.compile(
            r'(?<![A-Za-z0-9])([A-Za-z0-9+/=_-]{20,}|[A-Fa-f0-9]{32,})(?![A-Za-z0-9])')
        
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
        text_extensions = self.extensions
        return filename.lower().endswith(tuple(text_extensions))

    def find_line_number(self, content, match):
        """Return (line_number, line_text) for the first line containing match.

        If not found, returns (0, '').
        """
        for i, line in enumerate(content.split('\n'), 1):
            if match in line:
                return i, line
        return 0, ""

    # ---------------- Entropy ---------------- #
    def shannon_entropy(self, s):
        if not s:
            return 0.0

        freq = {}
        for ch in s:
            freq[ch] = freq.get(ch, 0) + 1

        entropy = 0.0
        length = len(s)

        for count in freq.values():
            p = count / length
            entropy -= p * math.log2(p)

        return entropy

    def looks_like_secret_candidate(self, token):
        if len(token) < 20:
            return False

        if token.isdigit():
            return False

        if len(set(token)) < 6:
            return False

        lowered = token.lower()
        obvious_fake = {
                "changeme",
                "your_token_here",
                "example",
                "testtesttest",
                "xxxxxxxxxxxxxxxxxxxx"
        }
        if lowered in obvious_fake:
            return False

        return True
    
    def entropy_severity(self, entropy, length):
        if length >= 32 and entropy >= 4.5:
            return "HIGH"
        if length >= 24 and entropy >= 4.0:
            return "MEDIUM"
        if length >= 20 and entropy >= 3.8:
            return "LOW"
        return None
    
    def scan_entropy_on_unmatched_lines(self, lines, regex_matched_lines, file_path, branch):
        seen_tokens = set()

        for line_number, line in enumerate(lines, start=1):
            if line_number in regex_matched_lines:
                continue

            stripped = line.strip()
            if not stripped:
                continue

            for m in self.entropy_candidate_pattern.finditer(line):
                token = m.group(1)

                if token in seen_tokens:
                    continue
                seen_tokens.add(token)

                if not self.looks_like_secret_candidate(token):
                   continue

                entropy = self.shannon_entropy(token)
                severity = self.entropy_severity(entropy, len(token))

                if not severity:
                    continue

                snippet = stripped[:1000]

                self.write_log(
                    f"Found possible secret via entropy! "
                    f"line={line_number}, entropy={entropy:.2f}, len={len(token)}"
                )

                insertScanFindings(
                    self.job_id, file_path, line_number, snippet, severity,
                f"High Entropy String ({entropy:.2f})",
                branch
                )
    # ---------------- Scanning ---------------- #

    def scan_content(self, content, file_path, branch):
        lines = content.splitlines()
        regex_matched_lines = set()

        for secret_type, (pattern, severity) in self.patterns.items():
            for m in re.finditer(pattern, content, flags=re.MULTILINE):
                match_text = m.group(0)
                line_number, line_text = self.find_line_number(content, match_text)
                
                if line_number:
                    regex_matched_lines.add(line_number)
                
                if line_text:
                    snippet = line_text.strip()
                else:
                    snippet = match_text

                if len(snippet) > 1000:
                    snippet = snippet[:1000]

                self.write_log("Found secret!")
                insertScanFindings(self.job_id, file_path, line_number, snippet, severity, secret_type, branch)

        
        # second pass: entropy scan on lines regex did not already flag
        self.scan_entropy_on_unmatched_lines(
            lines,
            regex_matched_lines,
            file_path,
            branch
        )

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


