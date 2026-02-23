import "server-only";
import { queryOne } from "@lib/database/remoteDataSource";
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
        rule
      `,
    [data.job_id, data.file_path, data.line_number, data.code_snippet, data.severity, data.rule],
  );

  if (!row) {
    throw new Error("Failed to insert scan finding");
  }

  return scanFindingSchema.parse(row);
}