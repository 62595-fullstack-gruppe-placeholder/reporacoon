import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app

# =========================================
#           Repository tests
# =========================================

# Simple test to see if the database connection works used in all other functions below
def test_get_connection():
    pass

# Test the functionality of the getAllPendingScanJobs function
# Including:
#  - Selection works
#  - Only gets jobs with pending status
#  - Returns both id and URL in a dictionary
def test_get_all_pending_scan_jobs():
    pass

# Test the functionality of the setParsingScanJobsToParsed function
# Including:
#  - Proper update of scan jobs
#  - Only updating scan jobs of given ids
def test_set_parsing_scan_jobs_to_parsed():
    pass

# Test the functionality of the getAllScanFindings (debug) function
# Including:
#  - Proper selection
def test_get_all_scan_findings():
    pass

# Test the functionality of the insertScanFindings function
# Including:
#  - Proper insertion
#  - Type checking for job_id, file_path, line_number, code_snippet, severity, rule
def test_insert_scan_findings():
    pass

# Test the functionality of the insertDurationInScanJobs function
# Including:
#  - Proper update of the duration column
#  - Only updating the scan job with given id
def test_insert_duration_in_scanjobs():
    pass
