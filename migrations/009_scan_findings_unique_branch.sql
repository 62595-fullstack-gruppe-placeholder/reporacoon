ALTER TABLE scan_findings DROP CONSTRAINT unique_finding;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_finding_with_branch'
    ) THEN
        ALTER TABLE scan_findings
        ADD CONSTRAINT unique_finding_with_branch
        UNIQUE(job_id, file_path, line_number, rule, code_snippet, branch);
    END IF;
END
$$;