import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logic import *

# =========================================
#             Logic/scan tests
# =========================================

# Test that the validate_github_url correctly identifies Github
# repositories and not other links
def test_validate_github_url():
    pass

# Test that the check_repo_exists function only returns true"
# for repositories that actually exist, returning 200 on success
# and 404 if it doesnt exist.
# NOTE: might be issues with rate limiting here (?)
def test_check_repo_exists():
    pass

# Test that the GitHubSecretScanner will properly clone a repo 
def test_clone_repo():
    pass

# Test that the scanning works by checking if it will find exposed secrets in our 
# test repository while ignoring files not in the "text_extension" list
def test_scan_repository():
    pass

