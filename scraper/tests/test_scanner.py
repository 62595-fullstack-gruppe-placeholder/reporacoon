import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logic import *
from api import *
import shutil
import re
import os

# =========================================
#             Logic/scan tests
# =========================================

# Test that the validate_github_url correctly identifies Github
# repositories and not other links
def test_validate_github_url():

    assert validate_github_url("https://github.com/62595-fullstack-gruppe-placeholder/reporacoon")[0] == True
    assert validate_github_url("https://github.com/62595-fullstack-gruppe-placeholder/reporacoon/pulls")[0] == False
    assert validate_github_url("https://www.dmi.dk/lokation/show/DK/2617284/Lundtofte/")[0] == False

# Test that the check_repo_exists function only returns true"
# for repositories that actually exist, returning 200 on success
# and 404 if it doesnt exist.
# NOTE: might be issues with rate limiting here (?)
def test_check_repo_exists():
    is_valid, message, repo_info = validate_github_url("https://github.com/62595-fullstack-gruppe-placeholder/reporacoon")
    owner = repo_info['owner']
    repo = repo_info['repo']
    assert check_repo_exists(owner, repo)[0] == True

    is_valid, message, repo_info = validate_github_url("https://github.com/MoellerGutten/ThisRepoDoesntExist1231231231")
    owner = repo_info['owner']
    repo = repo_info['repo']
    assert check_repo_exists(owner, repo)[0] == False


# Test that the GitHubSecretScanner will properly clone a repo 
def test_clone_repo():
    url = "https://github.com/62595-fullstack-gruppe-placeholder/testrepo"
    scanner = GitHubSecretScanner(url, '00000000-0000-0000-0000-000000000000')
    repo_path = scanner.clone_repo()
    try:
        assert os.path.exists(repo_path)
    finally:
        if repo_path and os.path.exists(repo_path):
            shutil.rmtree(repo_path)

# Test that the scanning works by checking if it will find exposed secrets in our 
# test repository while ignoring files not in the "text_extension" list
def test_scan_repository(mock_get_connection, insert_helpers):
    url = "https://github.com/62595-fullstack-gruppe-placeholder/testrepo"

    # create a scan job so inserted findings can reference it
    _insert_user, _insert_scan_job = insert_helpers
    job_id = _insert_scan_job(repo_url=url, status="PENDING")
    

    scanner = GitHubSecretScanner(url, job_id)
    repo_path = scanner.clone_repo()
    try:
        # ensure files exist in the cloned repo
        py_path = os.path.join(repo_path, 'thisFileShouldBeChecked.py')
        md_path = os.path.join(repo_path, 'ignoredMarkDown.md')
        assert os.path.exists(py_path), "expected python file not present in cloned repo"
        assert os.path.exists(md_path), "expected markdown file not present in cloned repo"

        # scanner should treat the python file as text and the markdown as ignored
        assert scanner.is_text_file('thisFileShouldBeChecked.py') is True
        assert scanner.is_text_file('ignoredMarkDown.md') is False

        # verify at least one of the scanner's patterns matches the python file content
        with open(py_path, 'r', errors='ignore') as f:
            content = f.read()

        matched = False

        for name, (pattern, severity) in scanner.patterns.items():
            if re.search(pattern, content, flags=re.MULTILINE | re.IGNORECASE):
                matched = True
                break

        assert matched, "no secret pattern matched content of thisFileShouldBeChecked.py"
        
        # count "Found secret!"
        found_secret_count = 0
        original_write_log = scanner.write_log

        def counting_write_log(message):
            nonlocal found_secret_count
            if "Found secret!" in message:
                found_secret_count += 1
            # still call the original logger if you want normal output
            original_write_log(message)

        scanner.write_log = counting_write_log

        scanner.scan_repository(repo_path, branch="main")

        assert found_secret_count == 4, f"expected 4 secrets, got {found_secret_count}"

    finally:
        if repo_path and os.path.exists(repo_path):
            shutil.rmtree(repo_path)

# Test that the scanning works by checking if it will find exposed secrets in our 
# test repository while ignoring files not in the "text_extension" list
def test_scan_deep(mock_get_connection, insert_helpers):
    url = "https://github.com/62595-fullstack-gruppe-placeholder/testrepo"

    # create a scan job so inserted findings can reference it
    _insert_user, _insert_scan_job = insert_helpers
    job_id = _insert_scan_job(repo_url=url, status="PENDING")

    scanner = GitHubSecretScanner(url, job_id, isDeepScan=True)
    repo_path = scanner.clone_repo()
    try:
        # count "Found secret!"
        found_secret_count = 0
        original_write_log = scanner.write_log

        def counting_write_log(message):
            nonlocal found_secret_count
            if "Found secret!" in message:
                found_secret_count += 1
            # still call the original logger if you want normal output
            original_write_log(message)

        scanner.write_log = counting_write_log

        scanner.scan_all_branches(repo_path)

        assert found_secret_count == 11, f"expected 11 secrets, got {found_secret_count}"

    finally:
        if repo_path and os.path.exists(repo_path):
            shutil.rmtree(repo_path)