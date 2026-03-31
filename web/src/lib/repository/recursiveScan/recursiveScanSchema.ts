import { z } from "zod";

export const SCAN_INTERVALS = ["EVERY_MINUTE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export type ScanInterval = (typeof SCAN_INTERVALS)[number];

export const recursiveScanSchema = z.object({
  id: z.uuidv4(),
  repo_url: z.url(),
  owner_id: z.uuidv4().nullable(),
  interval: z.enum(SCAN_INTERVALS),
  is_deep_scan: z.boolean(),
  extensions: z.array(z.string()).default([
    // Arbitrary list of extensions for the default
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php", ".yml",
  ]),
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
  extensions: z.array(z.string()).default([
    // Arbitrary list of extensions for the default
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php", ".yml",
  ]),
});

export type CreateRecursiveScanDTO = z.infer<typeof createRecursiveScanDTOSchema>;
