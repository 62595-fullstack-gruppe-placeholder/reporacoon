import "server-only";
import { queryOne } from "@lib/database/remoteDataSource";
import { CreateScanJobDTO, createScanJobDTOSchema, ScanJob, scanJobSchema } from "./scanJobSchemas";

/**
 * Create a new scan job from {@link CreateScanJobDTO}, returning the created {@link ScanJob}.
 */
export async function createScanJob(input: CreateScanJobDTO): Promise<ScanJob> {
  const data = createScanJobDTOSchema.parse(input);
  // The status will default to "PENDING", so omitting it from the insertion.
  const row = await queryOne<ScanJob>(
    `
      INSERT INTO scan_jobs (repo_url, owner_id, priority)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        repo_url,
        owner_id,
        priority,
        status,
        created_at
      `,
    [data.repo_url, data.owner_id, data.priority],
  );

  if (!row) {
    throw new Error("Failed to insert scan job");
  }

  return scanJobSchema.parse(row);
}