import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  CreateScanJobDTO,
  createScanJobDTOSchema,
  ScanJob,
  scanJobSchema,
  scanJobWithFindingsCount,
  ScanJobWithFindingsCount,
} from "./scanJobSchemas";

/**
 * Create a new scan job from {@link CreateScanJobDTO}, returning the created {@link ScanJob}.
 */
export async function createScanJob(input: CreateScanJobDTO): Promise<ScanJob> {
  const data = createScanJobDTOSchema.parse(input);
  
  // The status will default to "PENDING", so omitting it from the insertion.
  const row = await queryOne<ScanJob>(
    `
      INSERT INTO scan_jobs (repo_url, owner_id, repoKey, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        repo_url,
        owner_id,
        repoKey,
        priority,
        status,
        created_at,
        duration
      `,
    [data.repo_url, data.owner_id, data.repoKey, data.priority],
  );

  if (!row) {
    throw new Error("Failed to insert scan job");
  }

  return scanJobSchema.parse(row);
}

/**
 * Fetching scan finding by id, returning the {@link ScanFinding}.
 */
export async function getScanJobById(id: string): Promise<ScanJob> {
  const row = await queryOne<ScanJob>(
    `
        SELECT *
        FROM scan_jobs
        WHERE id = $1
        `,
    [id],
  );

  if (!row) {
    throw new Error("Failed to get scan job");
  }

  return scanJobSchema.parse(row);
}

export async function getScanJobsByRecursiveScanId(
  recursiveScanId: string,
): Promise<ScanJobWithFindingsCount[]> {
  const rows = await query<any>(
    `
    SELECT
      sj.id, sj.repo_url, sj.status, sj.owner_id, sj.priority,
      sj.created_at, sj.duration, sj.recursive_scan_id,
      NULL as repoKey, -- Security: Prevent sending the ciphertext to the frontend
      COALESCE(COUNT(f.id), 0)::INTEGER as findings_count
    FROM scan_jobs sj
    LEFT JOIN scan_findings f ON f.job_id = sj.id
    WHERE sj.recursive_scan_id = $1
    GROUP BY sj.id
    ORDER BY sj.created_at DESC
    `,
    [recursiveScanId],
  );
  return rows.map((row) => scanJobWithFindingsCount.parse(row));
}

export async function getUserScanJobs(
  userId: string,
  limit: number = 100,
): Promise<ScanJobWithFindingsCount[]> {
  const rows = await query<any>(
    `
    SELECT 
      sj.id, sj.repo_url, sj.status, sj.owner_id, sj.priority,
      sj.created_at, sj.duration, sj.recursive_scan_id,
      NULL as repoKey, -- Security: Prevent sending the ciphertext to the frontend
      COALESCE(COUNT(f.id), 0)::INTEGER as findings_count
    FROM scan_jobs sj
    LEFT JOIN scan_findings f ON f.job_id = sj.id
    WHERE sj.owner_id = $1
    GROUP BY sj.id
    ORDER BY sj.created_at DESC
    LIMIT $2
    `,
    [userId, limit],
  );

  return rows.map((row) => scanJobWithFindingsCount.parse(row));
}

export async function clearScanJobToken(id: string): Promise<void> {
  await query(`UPDATE scan_jobs SET repoKey = NULL WHERE id = $1`, [id]);
}