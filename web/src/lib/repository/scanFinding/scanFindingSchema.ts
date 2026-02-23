import { z } from "zod";

/**
 * Base scan finding schema. Represents a row in the `scan_findings` table.
 */
export const scanFindingSchema = z.object({
  id: z.uuidv4(),
  job_id: z.uuidv4(),
  file_path: z.string(),
  line_number: z.int(),
  code_snippet: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  rule: z.string(),
});

/**
 * Represents a row in the `scan_findings` table.
 */
export type ScanFinding = z.infer<typeof scanFindingSchema>;

/**
 * DTO for creating a scan finding in the `scan_findings` table.
 */
export const createScanFindingDTOSchema = z.object({
  job_id: z.uuidv4(),
  file_path: z.string(),
  line_number: z.int(),
  code_snippet: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  rule: z.string(),
});

/**
 * DTO for creating a scan finding in the `scan_findings` table.
 */
export type CreateScanFindingDTO = z.infer<typeof createScanFindingDTOSchema>;

