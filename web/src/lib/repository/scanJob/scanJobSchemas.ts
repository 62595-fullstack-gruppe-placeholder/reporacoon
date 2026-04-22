import { z } from "zod";

/**
 * Base scan job schema. Represents a row in the `scan_jobs` table.
 */
export const scanJobSchema = z.object({
  id: z.uuidv4(),
  repo_url: z.url(),
  status: z.enum(["PENDING", "PARSING", "PARSED", "FAILED"]).default("PENDING"),
  owner_id: z.uuidv4().nullable(),
  repoKey: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(5), /* MIGHT BRICK?*/
  created_at: z.coerce.date(),
  duration: z.number().int().nullable(), // nullable if some jobs have no duration yet
  listening_repository_id: z.string().nullable().optional(),
});

/**
 * Represents a row in the `scan_jobs` table.
 */
export type ScanJob = z.infer<typeof scanJobSchema>;

/**
 * {@link scanJobSchema} including the amount of findings for the job.
 */
export const scanJobWithFindingsCount = scanJobSchema.extend({
  findings_count: z.number(),
})

/**
 * Represents a scan job with extended with the amount of findings.
 */
export type ScanJobWithFindingsCount = z.infer<typeof scanJobWithFindingsCount>

/**
 * DTO for creating a scan job in the `scan_jobs` table.
 */
export const createScanJobDTOSchema = z.object({
  repo_url: z.url({error: "Not a valid URL"}),
  owner_id: z.uuidv4().nullable(),
  repoKey: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(5),
  listening_repository_id: z.string().nullable().optional(),
});

/**
 * DTO for creating a scan job in the `scan_jobs` table.
 */
export type CreateScanJobDTO = z.infer<typeof createScanJobDTOSchema>;
