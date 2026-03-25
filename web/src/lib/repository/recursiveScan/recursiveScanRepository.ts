import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  CreateRecursiveScanDTO,
  RecursiveScan,
  recursiveScanSchema,
} from "./recursiveScanSchema";

export async function createRecursiveScan(input: CreateRecursiveScanDTO): Promise<RecursiveScan> {
  const row = await queryOne<RecursiveScan>(
    `
    INSERT INTO recursive_scans (repo_url, owner_id, interval, is_deep_scan, next_run_at)
    VALUES ($1, $2, $3::scan_interval, $4,
      CASE $3::scan_interval
        WHEN 'EVERY_MINUTE' THEN NOW() + INTERVAL '1 minute'
        WHEN 'HOURLY'  THEN NOW() + INTERVAL '1 hour'
        WHEN 'DAILY'   THEN NOW() + INTERVAL '1 day'
        WHEN 'WEEKLY'  THEN NOW() + INTERVAL '7 days'
        WHEN 'MONTHLY' THEN NOW() + INTERVAL '1 month'
        WHEN 'YEARLY'  THEN NOW() + INTERVAL '1 year'
      END)
    RETURNING *
    `,
    [input.repo_url, input.owner_id, input.interval, input.is_deep_scan],
  );

  if (!row) throw new Error("Failed to create recurring scan");
  return recursiveScanSchema.parse(row);
}

export async function getRecursiveScansByOwner(ownerId: string): Promise<RecursiveScan[]> {
  const rows = await query<RecursiveScan>(
    `SELECT * FROM recursive_scans WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId],
  );
  return rows.map((r) => recursiveScanSchema.parse(r));
}

export async function deleteRecursiveScan(id: string, ownerId: string): Promise<void> {
  await query(
    `DELETE FROM recursive_scans WHERE id = $1 AND owner_id = $2`,
    [id, ownerId],
  );
}

export async function toggleRecursiveScan(id: string, ownerId: string): Promise<boolean> {
  const row = await queryOne<{ is_active: boolean }>(
    `UPDATE recursive_scans SET is_active = NOT is_active WHERE id = $1 AND owner_id = $2 RETURNING is_active`,
    [id, ownerId],
  );
  if (!row) throw new Error("Recurring scan not found");
  return row.is_active;
}
