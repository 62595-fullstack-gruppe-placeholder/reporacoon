import { z } from "zod";

/**
 * Base scan job schema. Represents a row in the `scan_jobs` table.
 */
export const scanJobSchema = z.object({
  id: z.uuidv4(),
  repo_url: z.url(),
  status: z.enum(["PENDING", "PARSING", "PARSED", "FAILED"]).default("PENDING"),
  owner_id: z.uuidv4().nullable(),
  priority: z.number().int().min(1).max(5), /* MIGHT BRICK?*/
  created_at: z.coerce.date(),
});

/**
 * Represents a row in the `scan_jobs` table.
 */
export type ScanJob = z.infer<typeof scanJobSchema>;

/**
 * DTO for creating a scan job in the `scan_jobs` table.
 */
export const createScanJobDTOSchema = z.object({
  repo_url: z.url(),
  owner_id: z.uuidv4().nullable(),
  priority: z.number().int().min(1).max(5),
});

/**
 * DTO for creating a scan job in the `scan_jobs` table.
 */
export type CreateScanJobDTO = z.infer<typeof createScanJobDTOSchema>;

