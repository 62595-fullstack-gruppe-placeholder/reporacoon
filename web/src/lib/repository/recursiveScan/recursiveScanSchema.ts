import { z } from "zod";

export const SCAN_INTERVALS = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export type ScanInterval = (typeof SCAN_INTERVALS)[number];

export const recursiveScanSchema = z.object({
  id: z.uuidv4(),
  repo_url: z.url(),
  owner_id: z.uuidv4().nullable(),
  interval: z.enum(SCAN_INTERVALS),
  is_deep_scan: z.boolean(),
  is_active: z.boolean(),
  last_run_at: z.coerce.date().nullable(),
  next_run_at: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type RecursiveScan = z.infer<typeof recursiveScanSchema>;

export const createRecursiveScanDTOSchema = z.object({
  repo_url: z.url({ error: "Not a valid URL" }),
  owner_id: z.uuidv4().nullable(),
  interval: z.enum(SCAN_INTERVALS),
  is_deep_scan: z.boolean().default(false),
});

export type CreateRecursiveScanDTO = z.infer<typeof createRecursiveScanDTOSchema>;
