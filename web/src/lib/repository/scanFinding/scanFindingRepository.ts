import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import { CreateScanFindingDTO, createScanFindingDTOSchema, ScanFinding, scanFindingSchema } from "./scanFindingSchema";

/**
 * Create a new scan finding from {@link CreateScanFindingDTO}, returning the created {@link ScanFinding}.
 */
export async function createScanFinding(input: CreateScanFindingDTO): Promise<ScanFinding> {
  const data = createScanFindingDTOSchema.parse(input);
  const row = await queryOne<ScanFinding>(
    `
      INSERT INTO scan_findings (job_id, file_path, line_number, code_snippet, severity, rule)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        job_id,
        file_path,
        line_number,
        code_snippet,
        severity,
        rule,
        branch
      `,
    [data.job_id, data.file_path, data.line_number, data.code_snippet, data.severity, data.rule, data.branch],
  );

  if (!row) {
    throw new Error("Failed to insert scan finding");
  }

  return scanFindingSchema.parse(row);
}


/**
 * Get all scan findings for a given job.
 * @param jobId id of the job for which to get findings.
 */
export async function getFindingsByJobId(jobId: string): Promise<ScanFinding[]> {
  const rows = await query<ScanFinding[]>(
      `
        SELECT *
        FROM scan_findings
        WHERE job_id = $1
        `,
      [jobId],
    );

  if (!rows) {
    throw new Error("Failed to get scan findings");
  }

  return rows.map((row) => scanFindingSchema.parse(row));
}
