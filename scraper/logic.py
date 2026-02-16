import re
import os
import argparse
import subprocess
import tempfile
import shutil
import json
import csv
import time
from datetime import datetime
from collections import defaultdict


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
    def __init__(self, repo_url, max_files=1000):
        self.repo_url = repo_url
        self.max_files = max_files
        self.scanned_files = 0
        self.findings = defaultdict(list)

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        self.scanlogs_dir = os.path.join(os.getcwd(), 'scanlogs')
        os.makedirs(self.scanlogs_dir, exist_ok=True)

        self.session_dir = os.path.join(
            self.scanlogs_dir,
            f"scan_{self.timestamp}"
        )
        os.makedirs(self.session_dir, exist_ok=True)

        self.log_file = os.path.join(self.session_dir, "scan.log")

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

    # ---------------- Logging ---------------- #

    def write_log(self, message):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)

        with open(self.log_file, "a") as f:
            f.write(log_entry + "\n")

    # ---------------- Git Clone ---------------- #

    def clone_repo(self):
        self.write_log("Cloning repository...")
        temp_dir = tempfile.mkdtemp()
        # TODO: add an option to search history and possibly more branches. History can be changed by modifying the depth flag.
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

    def mask_secret(self, secret):
        if len(secret) < 8:
            return "***MASKED***"
        return secret[:4] + "..." + secret[-4:]

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

                masked = self.mask_secret(match)
                line_number = self.find_line_number(content, match)

                finding = {
                    "type": secret_type,
                    "file_path": file_path,
                    "line_number": line_number,
                    "match": masked,
                    "timestamp": datetime.now().isoformat()
                }

                self.findings[secret_type].append(finding)
                self.write_log(
                    f"FOUND {secret_type} in {file_path}:{line_number}"
                )

    def scan_repository(self, repo_path):
        self.write_log("Scanning files locally...")

        for root, dirs, files in os.walk(repo_path):
            for file in files:
                if self.scanned_files >= self.max_files:
                    return

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

    # ---------------- Reporting ---------------- #

    def generate_report(self, elapsed_time):
        summary_file = os.path.join(self.session_dir, "summary.txt")
        json_file = os.path.join(self.session_dir, "findings.json")
        csv_file = os.path.join(self.session_dir, "findings.csv")

        total_secrets = sum(len(v) for v in self.findings.values())

        with open(summary_file, "w") as f:
            f.write("GITHUB SECRET SCANNER REPORT\n")
            f.write("=" * 50 + "\n")
            f.write(f"Target: {self.repo_url}\n")
            f.write(f"Files scanned: {self.scanned_files}\n")
            f.write(f"Secrets found: {total_secrets}\n")
            f.write(f"Time elapsed: {elapsed_time:.2f} seconds\n\n")

            for secret_type, matches in self.findings.items():
                f.write(f"{secret_type}: {len(matches)} found\n")

        with open(json_file, "w") as f:
            json.dump(self.findings, f, indent=2)

        with open(csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Type", "File", "Line", "Match"])

            for secret_type, matches in self.findings.items():
                for match in matches:
                    writer.writerow([
                        secret_type,
                        match["file_path"],
                        match["line_number"],
                        match["match"]
                    ])

        self.write_log("Scan complete.")
        self.write_log(f"Files scanned: {self.scanned_files}")
        self.write_log(f"Secrets found: {total_secrets}")
        self.write_log(f"Reports saved in: {self.session_dir}")

    # ---------------- Main ---------------- #

    def run(self):
        start = time.time()
        repo_path = None

        try:
            repo_path = self.clone_repo()
            self.scan_repository(repo_path)

        finally:
            if repo_path and os.path.exists(repo_path):
                shutil.rmtree(repo_path)
                self.write_log("Temporary repository deleted.")

        elapsed = time.time() - start
        self.generate_report(elapsed)


# ---------------- CLI ---------------- #

def main():
    parser = argparse.ArgumentParser(
        description="Scan GitHub repository for exposed secrets (clone-first method)"
    )
    parser.add_argument("url", help="GitHub repository URL")
    parser.add_argument("--max-files", type=int, default=1000)

    args = parser.parse_args()

    print("=" * 60)
    print("WARNING: Only scan repositories you own or have permission to test.")
    print("=" * 60)

    confirm = input("Do you have permission to scan this target? (yes/no): ")
    if confirm.lower() != "yes":
        print("Scan cancelled.")
        return

    scanner = GitHubSecretScanner(
        repo_url=args.url,
        max_files=args.max_files
    )

    scanner.run()


if __name__ == "__main__":
    main()
